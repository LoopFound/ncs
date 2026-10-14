import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness: the process is up and serving. Load balancers should use /api/ready. */
export function GET() {
  return NextResponse.json({ status: "ok", uptime: Math.round(process.uptime()) });
}
