import { NextResponse, type NextRequest } from "next/server";

// Must match backend/src/server/request.ts.
const IP_HEADER = "x-ncs-storefront-client-ip";
const SECRET_HEADER = "x-ncs-storefront-secret";

/**
 * /api/* is rewritten to the backend. Behind Vercel the backend only sees Vercel's egress IP, so we
 * forward the shopper's IP (Vercel sets x-real-ip itself and overwrites any client-supplied value)
 * with a shared secret the backend checks before trusting it. Client-sent copies are always dropped.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete(IP_HEADER);
  headers.delete(SECRET_HEADER);

  const secret = process.env.STOREFRONT_PROXY_SECRET;
  const ip = request.headers.get("x-real-ip")?.trim();
  if (secret && ip) {
    headers.set(IP_HEADER, ip);
    headers.set(SECRET_HEADER, secret);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: "/api/:path*" };
