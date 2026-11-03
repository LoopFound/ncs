import { describe, expect, it } from "vitest";
import { clientIp, parseClientIp, trustedProxyHops } from "@/server/request";

describe("trustedProxyHops", () => {
  it("defaults to 1 for missing or invalid values", () => {
    for (const v of [undefined, "", "abc", "-1", "1.5", "99"]) expect(trustedProxyHops(v)).toBe(1);
  });
  it("accepts 0..10", () => {
    expect(trustedProxyHops("0")).toBe(0);
    expect(trustedProxyHops("2")).toBe(2);
  });
});

describe("parseClientIp", () => {
  it("ignores spoofed left entries with one hop", () => {
    expect(parseClientIp("6.6.6.6, 1.1.1.1", null, 1)).toBe("1.1.1.1");
  });
  it("counts hops from the right (ALB + Caddy)", () => {
    expect(parseClientIp("6.6.6.6, 1.1.1.1, 10.0.0.5", null, 2)).toBe("1.1.1.1");
    expect(parseClientIp("1.1.1.1, 10.0.0.5", null, 2)).toBe("1.1.1.1");
  });
  it("clamps to the first entry when fewer entries than hops", () => {
    expect(parseClientIp("1.1.1.1", null, 3)).toBe("1.1.1.1");
  });
  it("ignores forwarded headers when hops is 0", () => {
    expect(parseClientIp("6.6.6.6", "7.7.7.7", 0)).toBe("unknown");
  });
  it("falls back to x-real-ip then unknown, tolerating blanks", () => {
    expect(parseClientIp(null, "7.7.7.7", 1)).toBe("7.7.7.7");
    expect(parseClientIp(" , ", null, 1)).toBe("unknown");
    expect(parseClientIp("", "", 1)).toBe("unknown");
  });
});

describe("clientIp", () => {
  it("different spoofed prefixes resolve to the same real client", () => {
    const a = new Headers({ "x-forwarded-for": "1.2.3.4, 9.9.9.9" });
    const b = new Headers({ "x-forwarded-for": "5.6.7.8, 9.9.9.9" });
    expect(clientIp(a)).toBe(clientIp(b));
  });
});
