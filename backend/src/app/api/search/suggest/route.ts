import { NextResponse, type NextRequest } from "next/server";
import { suggestProducts } from "@/server/services/catalog";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const rl = await rateLimit("suggest", clientIp(request.headers), 60, 60);
  if (!rl.ok) return NextResponse.json({ suggestions: [] }, { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } });
  const suggestions = await suggestProducts(q);
  return NextResponse.json({ suggestions }, { headers: { "cache-control": "public, max-age=60, s-maxage=60" } });
}
