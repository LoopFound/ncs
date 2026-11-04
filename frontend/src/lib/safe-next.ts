/**
 * Only allows same-site relative paths as post-login destinations (prevents open redirects).
 * Mirrors backend/src/lib/safe-redirect.ts, and also rejects control characters and
 * backslashes, which browsers strip or normalise into "//host" redirects.
 */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
    if (!next || typeof next !== "string") return fallback;
    if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback;
    if (!next.startsWith("/") || next.startsWith("//")) return fallback;
    if (next === "/login" || next.startsWith("/login?") || next.startsWith("/login/") || next.startsWith("/api/")) return fallback;
    return next.slice(0, 512);
}

/** Where the email-verification link returns to: the login page, keeping the sanitised ?next=. */
export function verifiedLoginPath(next: string | null | undefined): string {
    return `/login?verified=1&next=${encodeURIComponent(safeNext(next))}`;
}
