import { Redis, type RedisOptions } from "ioredis";
import { env } from "./env";
import { logger, errorInfo } from "./logger";

const globalForRedis = globalThis as unknown as { __ncsRedis?: Redis };

let lastErrorLog = 0;

function create(extra?: RedisOptions) {
  const client = new Redis(env().REDIS_URL, {
    lazyConnect: false,
    enableAutoPipelining: true,
    maxRetriesPerRequest: 3,
    ...extra,
  });
  // ioredis reconnects on its own; log outages (at most every 30s) instead of crashing on
  // unhandled "error" events. /api/ready reports the outage to the load balancer.
  client.on("error", (err) => {
    if (Date.now() - lastErrorLog < 30_000) return;
    lastErrorLog = Date.now();
    logger.error(errorInfo(err), "redis connection error");
  });
  return client;
}

/** Shared connection for cache / rate limiting. */
export function redis(): Redis {
  if (!globalForRedis.__ncsRedis) globalForRedis.__ncsRedis = create();
  return globalForRedis.__ncsRedis;
}

/** BullMQ requires its own connections with maxRetriesPerRequest = null. */
export function createQueueConnection(): Redis {
  return create({ maxRetriesPerRequest: null, enableAutoPipelining: false });
}
