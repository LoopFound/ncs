/**
 * Background worker: `node worker.js` (production) or `npm run worker:dev`.
 * Scale horizontally by running more replicas — BullMQ distributes jobs safely.
 */
import "dotenv/config";
import http from "node:http";
import { Queue, Worker, type Job } from "bullmq";
import { env } from "@/server/env";
import { createQueueConnection } from "@/server/redis";
import { QUEUE_NAMES, closeQueues, type JobName } from "@/server/queue";
import { db } from "@/server/db";
import { ensureBuckets } from "@/server/storage";
import { logger, errorInfo } from "@/server/logger";
import { redis } from "@/server/redis";
import { handlers } from "./handlers";
import { isFinalFailure, reportDeadJob } from "./alert";

const SHUTDOWN_TIMEOUT_MS = Number(process.env.WORKER_SHUTDOWN_TIMEOUT_MS ?? 30_000);

async function within<T>(fn: () => Promise<T>, ms = 2000): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([fn(), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("timeout")), ms)))]);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  env(); // fail fast on bad configuration
  await ensureBuckets().catch((err) => logger.warn(errorInfo(err), "could not verify storage buckets"));

  const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 10);
  const workers = Object.values(QUEUE_NAMES).map(
    (name) =>
      new Worker(
        name,
        async (job: Job) => {
          const handler = handlers[job.name as JobName] as ((data: unknown, job: Job) => Promise<unknown>) | undefined;
          if (!handler) throw new Error(`No handler for job ${job.name}`);
          return handler(job.data, job);
        },
        { connection: createQueueConnection(), concurrency },
      ),
  );

  for (const w of workers) {
    w.on("completed", (job) => logger.debug({ queue: w.name, job: job.name, id: job.id }, "job completed"));
    w.on("failed", (job, err) => {
      if (job && isFinalFailure(job)) {
        void reportDeadJob({ queue: w.name, name: job.name, id: job.id, attemptsMade: job.attemptsMade, attempts: job.opts.attempts ?? 1, error: err });
        return;
      }
      logger.error({ queue: w.name, job: job?.name, id: job?.id, attempts: job?.attemptsMade, ...errorInfo(err) }, "job failed");
    });
    w.on("error", (err) => logger.error(errorInfo(err), "worker error"));
  }

  // Periodic maintenance (idempotent scheduler — safe with many worker replicas).
  const scheduler = new Queue(QUEUE_NAMES.orders, { connection: createQueueConnection() });
  await scheduler.upsertJobScheduler("maintenance", { every: 15 * 60_000 }, { name: "maintenance.cleanup", data: {} });

  // Liveness endpoint for container health checks.
  const port = Number(process.env.WORKER_HEALTH_PORT ?? 3001);
  const server = http
    .createServer((req, res) => {
      void (async () => {
        const running = workers.every((w) => w.isRunning());
        const [database, cache] = await Promise.all([
          within(() => db.$queryRaw`SELECT 1`).then(() => true, () => false),
          within(() => redis().ping()).then(() => true, () => false),
        ]);
        const ok = running && database && cache;
        res.writeHead(ok ? 200 : 503, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: ok ? "ok" : "degraded", checks: { workers: running, database, redis: cache } }));
      })();
    })
    .listen(port);

  logger.info({ queues: Object.values(QUEUE_NAMES), concurrency, port }, "worker started");

  let shuttingDown = false;
  const shutdown = async (signal: string, code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "worker shutting down");
    // Hard stop if in-flight jobs or connections refuse to close.
    setTimeout(() => {
      logger.error({ signal }, "shutdown timed out; forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
    let failed = code !== 0;
    const step = async (label: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err) {
        failed = true;
        logger.error({ step: label, ...errorInfo(err) }, "error during shutdown");
      }
    };
    await step("http", () => new Promise<void>((resolve) => server.close(() => resolve())));
    await step("workers", () => Promise.all(workers.map((w) => w.close())));
    await step("scheduler", () => scheduler.close());
    await step("queues", () => closeQueues());
    await step("db", () => db.$disconnect());
    process.exit(failed ? 1 : 0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error(errorInfo(reason), "unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.fatal(errorInfo(err), "uncaught exception; shutting down");
    void shutdown("uncaughtException", 1);
  });
}

main().catch((err) => {
  logger.fatal(errorInfo(err), "worker failed to start");
  process.exit(1);
});
