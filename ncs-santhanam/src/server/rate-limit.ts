import { redis } from "./redis";
import { logger, errorInfo } from "./logger";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter shared by all instances through Redis.
 * Fails open if Redis is unavailable so an outage there never blocks checkout.
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
    logger.warn({ ...errorInfo(err), bucket }, "rate limiter unavailable; allowing request");
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}
