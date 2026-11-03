import { redis } from "./redis";
import { logger, errorInfo } from "./logger";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Buckets that must never be blocked by a Redis outage. */
const FAIL_OPEN_BUCKETS = new Set(["checkout"]);

const memory = new Map<string, { count: number; resetAt: number }>();
const MEMORY_MAX_KEYS = 10_000;

/** Per-process fallback used when Redis is down (limits are per instance, so approximate). */
function memoryLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  if (memory.size > MEMORY_MAX_KEYS) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
    if (memory.size > MEMORY_MAX_KEYS) memory.clear();
  }
  let entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowSeconds * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/** @internal test helper */
export function __resetMemoryLimiter() {
  memory.clear();
}

/**
 * Fixed-window limiter shared by all instances through Redis.
 * If Redis is unavailable: checkout fails open (an outage must not block orders);
 * every other bucket falls back to a per-process in-memory limiter.
 */
export async function rateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${bucket}:${identifier}:${window}`;
  try {
    const [[, count]] = (await redis().multi().incr(key).expire(key, windowSeconds + 1).exec()) as [
      [Error | null, number],
      [Error | null, number],
    ];
    const retryAfterSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds };
  } catch (err) {
    if (FAIL_OPEN_BUCKETS.has(bucket)) {
      logger.warn({ ...errorInfo(err), bucket }, "rate limiter unavailable; allowing request");
      return { ok: true, remaining: limit, retryAfterSeconds: 0 };
    }
    logger.warn({ ...errorInfo(err), bucket }, "rate limiter unavailable; using in-memory fallback");
    return memoryLimit(key, limit, windowSeconds);
  }
}
