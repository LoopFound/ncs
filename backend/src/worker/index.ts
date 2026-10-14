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
import { handlers } from "./handlers";

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
    w.on("failed", (job, err) =>
      logger.error({ queue: w.name, job: job?.name, id: job?.id, attempts: job?.attemptsMade, ...errorInfo(err) }, "job failed"),
    );
    w.on("error", (err) => logger.error(errorInfo(err), "worker error"));
  }

  // Periodic maintenance (idempotent scheduler — safe with many worker replicas).
  const scheduler = new Queue(QUEUE_NAMES.orders, { connection: createQueueConnection() });
  await scheduler.upsertJobScheduler("maintenance", { every: 15 * 60_000 }, { name: "maintenance.cleanup", data: {} });

  // Liveness endpoint for container health checks.
  const port = Number(process.env.WORKER_HEALTH_PORT ?? 3001);
  const server = http
    .createServer((req, res) => {
      const ok = workers.every((w) => w.isRunning());
      res.writeHead(ok ? 200 : 503, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: ok ? "ok" : "degraded" }));
    })
    .listen(port);

  logger.info({ queues: Object.values(QUEUE_NAMES), concurrency, port }, "worker started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "worker shutting down");
    server.close();
    await Promise.allSettled(workers.map((w) => w.close()));
    await scheduler.close();
    await closeQueues();
    await db.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal(errorInfo(err), "worker failed to start");
  process.exit(1);
});
