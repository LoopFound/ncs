import { db, type Tx } from "../db";
import type { CouponTerms } from "./pricing";

export class CouponError extends Error {}

export const normalizeCouponCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** Validates a coupon for this customer and cart subtotal. Throws CouponError with a customer-facing message. */
export async function validateCoupon(rawCode: string, userId: string | null, subtotal: number): Promise<CouponTerms & { id: string }> {
  const code = normalizeCouponCode(rawCode);
  const c = await db.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!c || !c.isActive) throw new CouponError("This coupon code isn't valid.");
  if (c.startsAt && c.startsAt > now) throw new CouponError("This coupon isn't active yet.");
  if (c.endsAt && c.endsAt < now) throw new CouponError("This coupon has expired.");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) throw new CouponError("This coupon has been fully redeemed.");
  if (subtotal < c.minOrderValue) {
    throw new CouponError(`Add ₹${Math.ceil((c.minOrderValue - subtotal) / 100).toLocaleString("en-IN")} more to use this coupon.`);
  }
  if (userId && c.perUserLimit > 0) {
    const used = await db.couponRedemption.count({ where: { couponId: c.id, userId } });
    if (used >= c.perUserLimit) throw new CouponError("You've already used this coupon.");
  }
  return { id: c.id, code: c.code, type: c.type, value: c.value, minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount };
}

/** Atomically consumes one use; fails if the global limit was reached concurrently. */
export async function redeemCoupon(tx: Tx, couponId: string, userId: string, orderId: string, amount: number) {
  const updated = await tx.$executeRaw`
    UPDATE coupons SET "usedCount" = "usedCount" + 1, "updatedAt" = now()
    WHERE id = ${couponId} AND "isActive" AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`;
  if (updated !== 1) throw new CouponError("This coupon has been fully redeemed.");
  await tx.couponRedemption.create({ data: { couponId, userId, orderId, amount } });
}

/** Returns a use to the pool when an order is cancelled before fulfilment. */
export async function releaseCoupon(tx: Tx, orderId: string) {
  const r = await tx.couponRedemption.findUnique({ where: { orderId } });
  if (!r) return;
  await tx.couponRedemption.delete({ where: { orderId } });
  await tx.$executeRaw`UPDATE coupons SET "usedCount" = GREATEST("usedCount" - 1, 0) WHERE id = ${r.couponId}`;
}
