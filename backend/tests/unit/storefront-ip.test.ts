import { describe, expect, it } from "vitest";
import { STOREFRONT_IP_HEADER, STOREFRONT_SECRET_HEADER, storefrontClientIp } from "@/server/request";

const SECRET = "s".repeat(40);
const h = (init: Record<string, string>) => new Headers(init);

describe("storefrontClientIp", () => {
  it("trusts the forwarded shopper IP only with the shared secret", () => {
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: SECRET, [STOREFRONT_IP_HEADER]: "203.0.113.7" }), SECRET)).toBe("203.0.113.7");
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: SECRET, [STOREFRONT_IP_HEADER]: "2001:db8::1" }), SECRET)).toBe("2001:db8::1");
  });

  it("ignores the header without, or with a wrong, secret", () => {
    expect(storefrontClientIp(h({ [STOREFRONT_IP_HEADER]: "203.0.113.7" }), SECRET)).toBeNull();
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: "x".repeat(40), [STOREFRONT_IP_HEADER]: "203.0.113.7" }), SECRET)).toBeNull();
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: "short", [STOREFRONT_IP_HEADER]: "203.0.113.7" }), SECRET)).toBeNull();
  });

  it("is disabled when no secret is configured and rejects non-IP values", () => {
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: SECRET, [STOREFRONT_IP_HEADER]: "203.0.113.7" }), undefined)).toBeNull();
    expect(storefrontClientIp(h({ [STOREFRONT_SECRET_HEADER]: SECRET, [STOREFRONT_IP_HEADER]: "1.2.3.4, 5.6.7.8" }), SECRET)).toBeNull();
  });
});
