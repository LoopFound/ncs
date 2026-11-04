import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GENERIC_ERROR, run } from "@/server/actions/result";
import { RateLimitError } from "@/server/rate-limit";
import { AuthError } from "@/server/session";
import { CartError } from "@/server/services/cart";
import {
  allowedOrigins,
  isOriginAllowed,
  parseJsonObject,
  statusForResult,
  storefrontPost,
  toResponse,
} from "@/server/storefront-http";

const allowed = allowedOrigins({ APP_URL: "https://ncsanthanam.in", STOREFRONT_URL: ["https://shop.example.com"] });

describe("isOriginAllowed", () => {
  it("accepts APP_URL and storefront origins", () => {
    expect(isOriginAllowed("POST", "https://ncsanthanam.in", allowed)).toBe(true);
    expect(isOriginAllowed("POST", "https://shop.example.com", allowed)).toBe(true);
    expect(isOriginAllowed("POST", "https://SHOP.example.com", allowed)).toBe(true);
  });
  it("rejects other origins, look-alikes and opaque origins", () => {
    for (const o of ["http://evil.test", "http://ncsanthanam.in", "https://ncsanthanam.in.evil.test", "https://shop.example.com:8443", "null", "garbage"]) {
      expect(isOriginAllowed("POST", o, allowed)).toBe(false);
    }
  });
  it("allows a missing Origin only for safe methods", () => {
    expect(isOriginAllowed("GET", null, allowed)).toBe(true);
    expect(isOriginAllowed("HEAD", null, allowed)).toBe(true);
    expect(isOriginAllowed("POST", null, allowed)).toBe(false);
    expect(isOriginAllowed("POST", "", allowed)).toBe(false);
  });
  it("still rejects a foreign Origin on GET", () => {
    expect(isOriginAllowed("GET", "http://evil.test", allowed)).toBe(false);
  });
});

describe("parseJsonObject", () => {
  it("parses objects and treats an empty body as {}", () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
    expect(parseJsonObject("  ")).toEqual({ ok: true, value: {} });
  });
  it("rejects bad JSON, non-objects and oversized bodies", () => {
    for (const text of ["{bad", "[1]", "null", '"x"', "42", `{"a":"${"x".repeat(70_000)}"}`]) {
      expect(parseJsonObject(text).ok).toBe(false);
    }
  });
});

describe("statusForResult", () => {
  it("maps results from run() by error type", async () => {
    const cases: [() => Promise<unknown>, number][] = [
      [async () => ({ x: 1 }), 200],
      [async () => undefined, 200],
      [async () => z.object({ a: z.string() }).parse({}), 400],
      [async () => { throw new CartError("Only 1 available."); }, 400],
      [async () => { throw new AuthError(); }, 401],
      [async () => { throw new AuthError("Not allowed.", "forbidden"); }, 403],
      [async () => { throw new RateLimitError("Slow down."); }, 429],
      [async () => { throw new Error("db exploded"); }, 500],
    ];
    for (const [fn, status] of cases) expect(statusForResult(await run("test", fn))).toBe(status);
  });
  it("falls back to the message when no code is present", () => {
    expect(statusForResult({ ok: false, error: "Please sign in to continue." })).toBe(401);
    expect(statusForResult({ ok: false, error: "Too many requests. Please try again a little later." })).toBe(429);
    expect(statusForResult({ ok: false, error: GENERIC_ERROR })).toBe(500);
    expect(statusForResult({ ok: false, error: "Coupon expired." })).toBe(400);
  });
});

describe("toResponse", () => {
  it("emits the contract shape without the internal error code", async () => {
    const res = toResponse(await run("test", async () => { throw new AuthError(); }));
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({ ok: false, error: "Please sign in to continue." });
    expect(await toResponse({ ok: true }).json()).toEqual({ ok: true });
  });
});

describe("storefrontPost", () => {
  const appUrl = process.env.APP_URL!;
  const echo = storefrontPost("test.echo", async (body) => ({ ok: true, data: body }));
  const post = (body: string, origin?: string) =>
    echo(new Request(`${appUrl}/api/storefront/test`, { method: "POST", body, headers: origin ? { origin } : {} }));

  it("rejects untrusted or missing origins with 403", async () => {
    expect((await post("{}", "http://evil.test")).status).toBe(403);
    expect((await post("{}")).status).toBe(403);
  });
  it("rejects bad JSON with 400 and passes objects through", async () => {
    expect((await post("{bad", appUrl)).status).toBe(400);
    const ok = await post('{"a":1}', appUrl);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true, data: { a: 1 } });
  });
  it("turns an unexpected throw into a 500", async () => {
    const boom = storefrontPost("test.boom", async () => { throw new Error("boom"); });
    const res = await boom(new Request(`${appUrl}/x`, { method: "POST", body: "{}", headers: { origin: appUrl } }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});
