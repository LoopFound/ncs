// Pure pricing maths — no I/O, fully unit-tested (tests/unit/pricing.test.ts).
// Every amount is integer paise and every price is GST-inclusive.
import { includedGst } from "@/lib/money";

export interface PricingLineInput {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  hsnCode: string;
  gstRateBps: number;
}

export interface PricedLine extends PricingLineInput {
  lineTotal: number; // unitPrice × quantity (before order-level discount)
  discount: number; // share of the order discount allocated to this line
  taxAmount: number; // GST contained in (lineTotal − discount)
}

export interface CouponTerms {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number; // PERCENT: basis points, FIXED: paise
  minOrderValue: number;
  maxDiscount: number | null;
}

export interface ShippingTerms {
  rate: number;
  freeAbove: number | null;
  codFee: number;
}

export interface Totals {
  lines: PricedLine[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  codFee: number;
  taxTotal: number;
  grandTotal: number;
}

export function couponDiscount(coupon: CouponTerms, subtotal: number): number {
  if (subtotal < coupon.minOrderValue) return 0;
  let d = coupon.type === "PERCENT" ? Math.floor((subtotal * coupon.value) / 10_000) : coupon.value;
  if (coupon.maxDiscount != null) d = Math.min(d, coupon.maxDiscount);
  return Math.max(0, Math.min(d, subtotal));
}

/** Splits `amount` across weights proportionally; remainders go to the largest fractions. */
export function allocate(amount: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (amount === 0 || total === 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / total);
  const base = exact.map(Math.floor);
  let remainder = amount - base.reduce((a, b) => a + b, 0);
  const order = exact.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    base[i] += 1;
    remainder -= 1;
  }
  return base;
}

export function computeTotals(
  inputs: PricingLineInput[],
  opts: { coupon?: CouponTerms | null; shipping?: ShippingTerms | null; cod?: boolean } = {},
): Totals {
  for (const l of inputs) {
    if (!Number.isInteger(l.unitPrice) || l.unitPrice <= 0) throw new Error(`Invalid price for ${l.sku}`);
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) throw new Error(`Invalid quantity for ${l.sku}`);
  }

  const lineTotals = inputs.map((l) => l.unitPrice * l.quantity);
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const discountTotal = opts.coupon ? couponDiscount(opts.coupon, subtotal) : 0;
  const discounts = allocate(discountTotal, lineTotals);

  const lines: PricedLine[] = inputs.map((l, i) => ({
    ...l,
    lineTotal: lineTotals[i],
    discount: discounts[i],
    taxAmount: includedGst(lineTotals[i] - discounts[i], l.gstRateBps),
  }));

  const merchandise = subtotal - discountTotal;
  const shipping = opts.shipping;
  const shippingTotal =
    !shipping || (shipping.freeAbove != null && merchandise >= shipping.freeAbove) ? 0 : shipping.rate;
  const codFee = opts.cod && shipping ? shipping.codFee : 0;

  // Delivery & COD charges follow the GST rate of the principal supply (highest line rate).
  const principalRate = Math.max(0, ...inputs.map((l) => l.gstRateBps));
  const chargesTax = includedGst(shippingTotal + codFee, principalRate);
  const taxTotal = lines.reduce((a, l) => a + l.taxAmount, 0) + chargesTax;

  return {
    lines,
    subtotal,
    discountTotal,
    shippingTotal,
    codFee,
    taxTotal,
    grandTotal: merchandise + shippingTotal + codFee,
  };
}
