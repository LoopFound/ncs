import { describe, expect, it } from "vitest";
import { allocate, computeTotals, couponDiscount, type PricingLineInput } from "@/server/services/pricing";
import { formatINR, includedGst } from "@/lib/money";

const line = (over: Partial<PricingLineInput> = {}): PricingLineInput => ({
  variantId: "v1",
  productId: "p1",
  name: "Saree",
  sku: "SKU-1",
  image: null,
  unitPrice: 4_500_000, // ₹45,000
  quantity: 1,
  hsnCode: "5007",
  gstRateBps: 500,
  ...over,
});

describe("includedGst", () => {
  it("extracts GST contained in an inclusive price", () => {
    // ₹45,000 incl. 5% → GST = 45000 × 5/105 = ₹2,142.857 → 214,286 paise
    expect(includedGst(4_500_000, 500)).toBe(214_286);
    expect(includedGst(105_00, 500)).toBe(500);
    expect(includedGst(1000, 0)).toBe(0);
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping and hides zero paise", () => {
    expect(formatINR(4_500_000)).toBe("₹45,000");
    expect(formatINR(1_23_45_678_90)).toBe("₹1,23,45,678.9");
  });
});

describe("allocate", () => {
  it("always distributes exactly the requested amount", () => {
    for (const [amount, weights] of [
      [100, [1, 1, 1]],
      [7, [3, 3, 1]],
      [0, [5, 5]],
      [999_999, [123, 4567, 89]],
    ] as [number, number[]][]) {
      const parts = allocate(amount, weights);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(amount);
      expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
    }
  });
});

describe("couponDiscount", () => {
  const pct = { code: "TEN", type: "PERCENT" as const, value: 1000, minOrderValue: 0, maxDiscount: null };
  it("applies percentage discounts", () => expect(couponDiscount(pct, 2_000_000)).toBe(200_000));
  it("caps at maxDiscount", () => expect(couponDiscount({ ...pct, maxDiscount: 50_000 }, 2_000_000)).toBe(50_000));
  it("respects the minimum order value", () => expect(couponDiscount({ ...pct, minOrderValue: 3_000_000 }, 2_000_000)).toBe(0));
  it("never exceeds the subtotal for fixed coupons", () =>
    expect(couponDiscount({ ...pct, type: "FIXED", value: 10_000_000 }, 2_000_000)).toBe(2_000_000));
});

describe("computeTotals", () => {
  it("keeps prices GST-inclusive (grand total = subtotal with free shipping)", () => {
    const t = computeTotals([line(), line({ variantId: "v2", sku: "SKU-2", unitPrice: 1_850_000, quantity: 2 })]);
    expect(t.subtotal).toBe(4_500_000 + 3_700_000);
    expect(t.grandTotal).toBe(t.subtotal);
    expect(t.taxTotal).toBe(includedGst(4_500_000, 500) + includedGst(3_700_000, 500));
  });

  it("allocates coupon discounts across lines and reduces GST accordingly", () => {
    const coupon = { code: "TEN", type: "PERCENT" as const, value: 1000, minOrderValue: 0, maxDiscount: null };
    const t = computeTotals([line(), line({ variantId: "v2", sku: "SKU-2", unitPrice: 1_000_000 })], { coupon });
    expect(t.discountTotal).toBe(550_000);
    expect(t.lines.reduce((a, l) => a + l.discount, 0)).toBe(550_000);
    expect(t.grandTotal).toBe(5_500_000 - 550_000);
    expect(t.taxTotal).toBe(t.lines.reduce((a, l) => a + includedGst(l.lineTotal - l.discount, l.gstRateBps), 0));
  });

  it("charges shipping below the free threshold and adds COD fees", () => {
    const shipping = { rate: 15_000, freeAbove: 10_000_000, codFee: 5_000 };
    const t = computeTotals([line()], { shipping, cod: true });
    expect(t.shippingTotal).toBe(15_000);
    expect(t.codFee).toBe(5_000);
    expect(t.grandTotal).toBe(4_500_000 + 20_000);
    const free = computeTotals([line({ unitPrice: 12_000_000 })], { shipping });
    expect(free.shippingTotal).toBe(0);
  });

  it("rejects invalid quantities and prices", () => {
    expect(() => computeTotals([line({ quantity: 0 })])).toThrow();
    expect(() => computeTotals([line({ unitPrice: 10.5 })])).toThrow();
  });
});
