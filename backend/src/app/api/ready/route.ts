import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { redis } from "@/server/redis";
import { storageHealthy } from "@/server/storage";
import { logger, errorInfo } from "@/server/logger";

export const dynamic = "force-dynamic";

async function check(name: string, fn: () => Promise<unknown>, timeoutMs = 2000): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    if (result === false) {
      logger.warn({ check: name }, "readiness check failed");
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ check: name, ...errorInfo(err) }, "readiness check failed");
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Readiness: dependencies reachable. Used by the ALB / Caddy health checks.
 * Database and Redis are hard requirements. S3 is reported in `checks.s3` but only fails
 * readiness when READY_REQUIRE_S3=true (a storage blip should not drain every web replica).
 */
export async function GET() {
  const requireS3 = ["true", "1"].includes((process.env.READY_REQUIRE_S3 ?? "").toLowerCase());
  const [database, cache, s3] = await Promise.all([
    check("database", () => db.$queryRaw`SELECT 1`),
    check("redis", () => redis().ping()),
    check("s3", () => storageHealthy()),
  ]);
  const ok = database && cache && (!requireS3 || s3);
  return NextResponse.json(
    { status: ok ? "ready" : "not-ready", checks: { database, redis: cache, s3 } },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
