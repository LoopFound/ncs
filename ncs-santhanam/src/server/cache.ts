import { redis } from "./redis";
import { logger, errorInfo } from "./logger";

/**
 * Shared, cross-instance cache backed by Redis.
 *
 * Invalidation uses per-tag version counters: every cache key embeds the current
 * version of each of its tags, so `invalidateTags(["catalog"])` makes all dependent
 * entries unreachable on every app replica at once (they then expire via TTL).
 * Values must be JSON-serialisable (no Date objects — use ISO strings).
 */
export async function cached<T>(
  key: string,
  opts: { ttlSeconds: number; tags: string[] },
  load: () => Promise<T>,
): Promise<T> {
  let fullKey: string | undefined;
  try {
    const r = redis();
    const versions = opts.tags.length ? await r.mget(opts.tags.map(tagKey)) : [];
    fullKey = `cache:${key}:${versions.map((v) => v ?? "0").join(".")}`;
    const hit = await r.get(fullKey);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn({ ...errorInfo(err), key }, "cache read failed; falling back to source");
    return load();
  }

  const value = await load();
  try {
    await redis().set(fullKey!, JSON.stringify(value), "EX", opts.ttlSeconds);
  } catch (err) {
    logger.warn({ ...errorInfo(err), key }, "cache write failed");
  }
  return value;
}

export async function invalidateTags(tags: string[]) {
  if (!tags.length) return;
  try {
    const pipeline = redis().pipeline();
    for (const t of tags) pipeline.incr(tagKey(t));
    await pipeline.exec();
  } catch (err) {
    logger.error({ ...errorInfo(err), tags }, "cache invalidation failed");
  }
}

function tagKey(tag: string) {
  return `cache:tag:${tag}`;
}

export const CacheTags = {
  catalog: "catalog",
  content: "content",
  settings: "settings",
  product: (slug: string) => `product:${slug}`,
} as const;
