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

export function clientIp(headers: Headers): string {
  return parseClientIp(headers.get("x-forwarded-for"), headers.get("x-real-ip"), trustedProxyHops());
}
