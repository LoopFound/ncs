import { NextResponse } from "next/server";
import { GENERIC_ERROR, type ActionErrorCode } from "./actions/result";
import { env } from "./env";
import { errorInfo, logger } from "./logger";

/**
 * HTTP plumbing for /api/storefront/*: the separate storefront app proxies these routes
 * same-origin (frontend rewrite /api/* -> backend), so responses are plain JSON ActionResults.
 */

/** Largest JSON body accepted (cart sync with 50 lines is ~3 KB). */
export const MAX_BODY_BYTES = 64 * 1024;

type JsonBody = Record<string, unknown>;

/** Any ActionResult, whatever its data type. */
export type AnyActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; fields?: Record<string, string>; code?: ActionErrorCode };

/** Origins allowed to POST: the backend itself (APP_URL) plus every STOREFRONT_URL origin. */
export function allowedOrigins(e: { APP_URL: string; STOREFRONT_URL: string[] } = env()): Set<string> {
  return new Set([new URL(e.APP_URL).origin, ...e.STOREFRONT_URL]);
}

/**
 * CSRF guard. A present Origin must be one of `allowed`; a missing Origin is accepted only for
 * safe methods (browsers always send Origin on cross-site and same-origin POSTs).
 */
export function isOriginAllowed(method: string, origin: string | null, allowed: ReadonlySet<string>): boolean {
  if (origin === null || origin === "") return method === "GET" || method === "HEAD";
  try {
    return allowed.has(new URL(origin).origin); // "null" (opaque origin) fails to parse → rejected
  } catch {
    return false;
  }
}

/** Parses a request body that must be a JSON object; an empty body counts as {}. */
export function parseJsonObject(text: string): { ok: true; value: JsonBody } | { ok: false; error: string } {
  if (text.length > MAX_BODY_BYTES) return { ok: false, error: "Request body is too large." };
  if (text.trim() === "") return { ok: true, value: {} };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, error: "Request body must be valid JSON." };
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Request body must be a JSON object." };
  return { ok: true, value: value as JsonBody };
}

/** HTTP status for an ActionResult. Uses the error code set by run(); falls back to the message. */
export function statusForResult(result: AnyActionResult): number {
  if (result.ok) return 200;
  switch (result.code) {
    case "INVALID":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL":
      return 500;
  }
  // Results built without run() (no code).
  if (result.error === GENERIC_ERROR) return 500;
  if (/\bsign in\b/i.test(result.error)) return 401;
  if (/too many|too quickly/i.test(result.error)) return 429;
  return 400;
}

const NO_STORE = { "cache-control": "private, no-store" };

/** Serialises an ActionResult in the public contract shape ({ ok, data } / { ok, error, fields }). */
export function toResponse(result: AnyActionResult): NextResponse {
  const body = result.ok
    ? { ok: true as const, ...(result.data === undefined ? {} : { data: result.data }) }
    : { ok: false as const, error: result.error, ...(result.fields ? { fields: result.fields } : {}) };
  return NextResponse.json(body, { status: statusForResult(result), headers: NO_STORE });
}

export function errorResponse(status: number, error: string): NextResponse {
  return NextResponse.json({ ok: false, error }, { status, headers: NO_STORE });
}

const isNextControlFlow = (err: unknown) =>
  Boolean(err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_"));

async function guarded(name: string, request: Request, fn: () => Promise<Response>): Promise<Response> {
  if (!isOriginAllowed(request.method, request.headers.get("origin"), allowedOrigins())) {
    logger.warn({ route: name, origin: request.headers.get("origin") }, "storefront request from untrusted origin");
    return errorResponse(403, "This request isn't allowed from this site.");
  }
  try {
    return await fn();
  } catch (err) {
    if (isNextControlFlow(err)) throw err;
    logger.error({ ...errorInfo(err), route: name }, "storefront route failed");
    return errorResponse(500, GENERIC_ERROR);
  }
}

/** Builds a GET handler: origin guard + ActionResult → JSON response. */
export function storefrontGet(name: string, handler: () => Promise<AnyActionResult>) {
  return (request: Request) => guarded(name, request, async () => toResponse(await handler()));
}

/** Builds a POST handler: origin guard + JSON-object body + ActionResult → JSON response. */
export function storefrontPost(name: string, handler: (body: JsonBody) => Promise<AnyActionResult>) {
  return (request: Request) =>
    guarded(name, request, async () => {
      const declared = Number(request.headers.get("content-length") ?? 0);
      if (declared > MAX_BODY_BYTES) return errorResponse(400, "Request body is too large.");
      const parsed = parseJsonObject(await request.text());
      if (!parsed.ok) return errorResponse(400, parsed.error);
      return toResponse(await handler(parsed.value));
    });
}
