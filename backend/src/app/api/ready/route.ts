import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { redis } from "@/server/redis";

export const dynamic = "force-dynamic";

async function check(fn: () => Promise<unknown>, timeoutMs = 2000): Promise<boolean> {
  try {
    await Promise.race([fn(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs))]);
    return true;
  } catch {
    return false;
  }
}

/** Readiness: dependencies reachable. Used by the ALB / Caddy health checks. */
export async function GET() {
  const [database, cache] = await Promise.all([check(() => db.$queryRaw`SELECT 1`), check(() => redis().ping())]);
  const ok = database && cache;
  return NextResponse.json(
    { status: ok ? "ready" : "not-ready", checks: { database, redis: cache } },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
