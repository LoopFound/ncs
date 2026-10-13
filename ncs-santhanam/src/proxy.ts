import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED = ["/account", "/admin", "/checkout"];
const isDev = process.env.NODE_ENV !== "production";

function contentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://checkout.razorpay.com${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:" + (isDev ? " http://localhost:*" : ""),
    "font-src 'self' data:",
    "connect-src 'self' https://*.razorpay.com" + (isDev ? " ws: http://localhost:*" : ""),
    "frame-src https://api.razorpay.com https://checkout.razorpay.com https://www.google.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/**
 * Runs before every page request:
 *  - per-request CSP nonce + security headers
 *  - optimistic redirect to /login for protected areas (real authorisation happens server-side)
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const cookie = getSessionCookie(request, { cookiePrefix: "ncs" });
    if (!cookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")");
  response.headers.set("cross-origin-opener-policy", "same-origin-allow-popups");
  if (!isDev) response.headers.set("strict-transport-security", "max-age=63072000; includeSubDomains; preload");
  return response;
}

export const config = {
  matcher: [
    // Pages only — skip API routes, static files and image optimisation.
    {
      source: "/((?!api/|_next/static|_next/image|images/|favicon.ico|logo1.jpg|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
