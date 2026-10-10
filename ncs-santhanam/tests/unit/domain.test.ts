import { describe, expect, it } from "vitest";
import { pickRule } from "@/server/services/shipping";
import { canTransition, ORDER_TRANSITIONS, withinReturnWindow } from "@/server/services/orders";
import { financialYear } from "@/server/services/invoices";
import { hmacHex, verifyPaymentSignature, verifyWebhookSignature } from "@/server/services/payments/razorpay";
import { normalizeIndianMobile } from "@/server/services/notifications/sms";
import { sniffImageType } from "@/server/storage";
import { safeNext } from "@/lib/safe-redirect";
import { addressSchema, checkoutSchema, indianMobile } from "@/lib/validation";

describe("shipping rule selection", () => {
  const rules = [
    { id: "india", prefixes: [] as string[], priority: 0 },
    { id: "tn", prefixes: ["60", "61", "62", "63", "64"], priority: 10 },
    { id: "chennai", prefixes: ["600"], priority: 0 },
  ];
  it("prefers the most specific prefix", () => expect(pickRule(rules, "600028")?.id).toBe("chennai"));
  it("falls back through broader rules", () => {
    expect(pickRule(rules, "631501")?.id).toBe("tn");
    expect(pickRule(rules, "560001")?.id).toBe("india");
  });
  it("returns null when nothing covers the PIN code", () => expect(pickRule(rules.slice(1), "110001")).toBeNull());
});

describe("order state machine", () => {
  it("allows only defined transitions", () => {
    expect(canTransition("PENDING_PAYMENT", "CONFIRMED")).toBe(true);
    expect(canTransition("SHIPPED", "CANCELLED")).toBe(false);
    expect(canTransition("DELIVERED", "RETURN_REQUESTED")).toBe(true);
    expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
  });
  it("has terminal states", () => {
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
    expect(ORDER_TRANSITIONS.REFUNDED).toEqual([]);
  });
  it("enforces the 7-day return window", () => {
    const now = new Date("2026-10-10T12:00:00Z");
    expect(withinReturnWindow(new Date("2026-10-05T12:00:00Z"), now)).toBe(true);
    expect(withinReturnWindow(new Date("2026-10-01T12:00:00Z"), now)).toBe(false);
    expect(withinReturnWindow(null, now)).toBe(false);
  });
});

describe("financial year", () => {
  it("rolls over in April", () => {
    expect(financialYear(new Date("2026-03-31T10:00:00"))).toBe("2025-26");
    expect(financialYear(new Date("2026-04-01T10:00:00"))).toBe("2026-27");
  });
});

describe("razorpay signatures", () => {
  it("verifies checkout signatures with the key secret", () => {
    const sig = hmacHex("secret", "order_1|pay_1");
    expect(verifyPaymentSignature("order_1", "pay_1", sig, "secret")).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", sig, "secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "", "secret")).toBe(false);
  });
  it("verifies webhook bodies byte-for-byte", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, hmacHex("whsec", body), "whsec")).toBe(true);
    expect(verifyWebhookSignature(`${body} `, hmacHex("whsec", body), "whsec")).toBe(false);
    expect(verifyWebhookSignature(body, hmacHex("whsec", body), "")).toBe(false);
  });
});

describe("Indian mobile numbers", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["919876543210", "+919876543210"],
  ])("normalises %s", (input, out) => {
    expect(normalizeIndianMobile(input)).toBe(out);
    expect(indianMobile.parse(input)).toBe(out);
  });
  it("rejects invalid numbers", () => {
    expect(normalizeIndianMobile("12345")).toBeNull();
    expect(normalizeIndianMobile("5876543210")).toBeNull();
  });
});

describe("validation", () => {
  const address = { fullName: "Radhika R", phone: "9876543210", line1: "12 Temple St", city: "Chennai", state: "Tamil Nadu", pincode: "600028" };
  it("accepts a valid address", () => expect(addressSchema.parse(address).phone).toBe("+919876543210"));
  it("rejects a bad PIN code and unknown state", () => {
    expect(addressSchema.safeParse({ ...address, pincode: "060028" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, state: "Atlantis" }).success).toBe(false);
  });
  it("requires exactly one of addressId / address", () => {
    expect(checkoutSchema.safeParse({ paymentMethod: "COD" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ paymentMethod: "COD", addressId: "a1", address }).success).toBe(false);
    expect(checkoutSchema.safeParse({ paymentMethod: "COD", addressId: "a1" }).success).toBe(true);
  });
});

describe("safeNext", () => {
  it("only allows same-site paths", () => {
    expect(safeNext("/checkout")).toBe("/checkout");
    expect(safeNext("//evil.com")).toBe("/account");
    expect(safeNext("https://evil.com")).toBe("/account");
    expect(safeNext("/\\evil.com")).toBe("/account");
    expect(safeNext(undefined)).toBe("/account");
  });
});

describe("image sniffing", () => {
  it("detects real formats and rejects disguised files", () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(sniffImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
});
