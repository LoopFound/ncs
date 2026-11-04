import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

/** Header the app sets itself (overwriting any inbound value) with the resolved client IP. */
export const CLIENT_IP_HEADER = "x-ncs-client-ip";

/**
 * Number of trusted reverse proxies in front of the app that each append the
 * address they saw to X-Forwarded-For. Default 1 (Caddy alone). Behind ALB -> Caddy use 2.
 */
export function trustedProxyHops(raw: string | undefined = process.env.TRUSTED_PROXY_HOPS): number {
  const n = Number(raw);
  return raw !== undefined && raw.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 10 ? n : 1;
}

/**
 * Picks the client IP from X-Forwarded-For counting from the RIGHT: each trusted proxy
 * appends one entry, so entries further left are client-controlled and must be ignored.
 * hops = 0 means no proxy: forwarded headers are ignored entirely.
 */
export function parseClientIp(forwardedFor: string | null, realIp: string | null, hops: number): string {
  if (hops <= 0) return "unknown";
  const parts = (forwardedFor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts[Math.max(0, parts.length - hops)]!;
  return realIp?.trim() || "unknown";
}

/** Headers the storefront's proxy.ts adds to every /api request it forwards (inbound copies are stripped there). */
export const STOREFRONT_IP_HEADER = "x-ncs-storefront-client-ip";
export const STOREFRONT_SECRET_HEADER = "x-ncs-storefront-secret";

function secretsMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The storefront reaches us through Vercel, a public peer that Caddy does not trust, so X-Forwarded-For
 * only shows Vercel's egress IP and every shopper would share one rate-limit bucket. The storefront
 * therefore forwards the platform-verified client IP together with a shared secret; we only believe it
 * when the secret matches.
 */
export function storefrontClientIp(headers: Headers, secret: string | undefined = process.env.STOREFRONT_PROXY_SECRET): string | null {
  if (!secret) return null;
  const given = headers.get(STOREFRONT_SECRET_HEADER);
  if (!given || !secretsMatch(given, secret)) return null;
  const ip = headers.get(STOREFRONT_IP_HEADER)?.trim();
  return ip && isIP(ip) ? ip : null;
}

export function clientIp(headers: Headers): string {
  return storefrontClientIp(headers) ?? parseClientIp(headers.get("x-forwarded-for"), headers.get("x-real-ip"), trustedProxyHops());
}
