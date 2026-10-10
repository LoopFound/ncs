import { db } from "../db";
import { features } from "../env";
import { redis } from "../redis";
import { enqueue } from "../queue";
import { logger, errorInfo } from "../logger";
import { isPlaceholderEmail } from "../auth";
import type { SessionUser } from "../session";
import type { CheckoutInput } from "@/lib/validation";
import { computeTotals, type PricingLineInput, type Totals } from "./pricing";
import { quoteShipping, type ShippingQuote } from "./shipping";
import { CouponError, normalizeCouponCode, redeemCoupon, validateCoupon } from "./coupons";
import { reserveStock } from "./inventory";
import { nextOrderNumber, transitionOrder } from "./orders";
import { createRazorpayOrder, razorpayKeyId } from "./payments/razorpay";
import { getStoreInfo } from "./content";

export class CheckoutError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

export interface CheckoutQuote {
  totals: Omit<Totals, "lines">;
  lines: { variantId: string; name: string; image: string | null; quantity: number; lineTotal: number }[];
  shipping: Pick<ShippingQuote, "etaMinDays" | "etaMaxDays" | "codAvailable"> | null;
  couponCode: string | null;
  couponError: string | null;
  codAllowed: boolean;
  codReason: string | null;
  razorpayEnabled: boolean;
}

async function loadCartLines(userId: string): Promise<PricingLineInput[]> {
  const cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
              },
            },
          },
        },
      },
    },
  });
  if (!cart || cart.items.length === 0) throw new CheckoutError("Your bag is empty.");
  return cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    if (!v.isActive || p.status !== "ACTIVE") throw new CheckoutError(`${p.name} is no longer available. Please remove it from your bag.`);
    if (v.stock < item.quantity) {
      throw new CheckoutError(v.stock === 0 ? `${p.name} has just sold out.` : `Only ${v.stock} of ${p.name} left — please update your bag.`);
    }
    return {
      variantId: v.id,
      productId: p.id,
      name: p.name,
      sku: v.sku,
      image: p.images[0]?.url ?? null,
      unitPrice: v.price,
      quantity: item.quantity,
      hsnCode: p.hsnCode ?? p.category.hsnCode,
      gstRateBps: p.gstRateBps ?? p.category.gstRateBps,
    };
  });
}

async function price(user: SessionUser, pincode: string | null, couponCode: string | null, method: "RAZORPAY" | "COD") {
  const lines = await loadCartLines(user.id);
  const shipping = pincode ? await quoteShipping(pincode) : null;
  const preCoupon = computeTotals(lines, { shipping });

  let coupon = null;
  let couponError: string | null = null;
  if (couponCode) {
    try {
      coupon = await validateCoupon(couponCode, user.id, preCoupon.subtotal);
    } catch (err) {
      if (!(err instanceof CouponError)) throw err;
      couponError = err.message;
    }
  }

  const settings = await getStoreInfo();
  const withoutCod = computeTotals(lines, { coupon, shipping });
  let codReason: string | null = null;
  if (!settings.codEnabled) codReason = "Cash on delivery is currently unavailable.";
  else if (!shipping) codReason = "Enter a serviceable PIN code to check cash on delivery.";
  else if (!shipping.codAvailable) codReason = "Cash on delivery isn't available for this PIN code.";
  else if (withoutCod.grandTotal > shipping.codMaxOrderValue)
    codReason = `Cash on delivery is available for orders up to ₹${(shipping.codMaxOrderValue / 100).toLocaleString("en-IN")}.`;
  else if (!user.phoneNumberVerified) codReason = "Verify your mobile number in your account to use cash on delivery.";

  const totals = computeTotals(lines, { coupon, shipping, cod: method === "COD" && !codReason });
  return { lines, shipping, coupon, couponError, totals, codReason };
}

/** Live price breakdown for the checkout page (no side effects). */
export async function quoteCheckout(
  user: SessionUser,
  input: { pincode?: string | null; couponCode?: string | null; paymentMethod?: "RAZORPAY" | "COD" },
): Promise<CheckoutQuote> {
  const code = input.couponCode ? normalizeCouponCode(input.couponCode) : null;
  const r = await price(user, input.pincode ?? null, code, input.paymentMethod ?? "RAZORPAY");
  const { lines: priced, ...totals } = r.totals;
  return {
    totals,
    lines: priced.map((l) => ({ variantId: l.variantId, name: l.name, image: l.image, quantity: l.quantity, lineTotal: l.lineTotal })),
    shipping: r.shipping ? { etaMinDays: r.shipping.etaMinDays, etaMaxDays: r.shipping.etaMaxDays, codAvailable: r.shipping.codAvailable } : null,
    couponCode: r.coupon ? r.coupon.code : null,
    couponError: r.couponError,
    codAllowed: !r.codReason,
    codReason: r.codReason,
    razorpayEnabled: features.razorpay(),
  };
}

export interface PlacedOrder {
  orderId: string;
  number: string;
  paymentMethod: "RAZORPAY" | "COD";
  razorpay?: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    prefill: { name: string; email?: string; contact: string };
  };
}

export async function placeOrder(user: SessionUser, input: CheckoutInput): Promise<PlacedOrder> {
  const lockKey = `lock:checkout:${user.id}`;
  const locked = await redis().set(lockKey, "1", "EX", 30, "NX");
  if (!locked) throw new CheckoutError("Your previous order is still being placed. Please wait a moment.");

  try {
    // Resolve shipping address.
    let address;
    if (input.addressId) {
      const saved = await db.address.findFirst({ where: { id: input.addressId, userId: user.id } });
      if (!saved) throw new CheckoutError("That address is no longer available.", "addressId");
      address = {
        fullName: saved.fullName, phone: saved.phone, line1: saved.line1, line2: saved.line2 ?? "",
        landmark: saved.landmark ?? "", city: saved.city, state: saved.state, pincode: saved.pincode,
      };
    } else {
      address = { ...input.address!, line2: input.address!.line2 ?? "", landmark: input.address!.landmark ?? "" };
    }

    const email = !isPlaceholderEmail(user.email) ? user.email : input.email || null;
    if (!email) throw new CheckoutError("Please add an email address for your invoice.", "email");

    if (input.paymentMethod === "RAZORPAY" && !features.razorpay()) {
      throw new CheckoutError("Online payment is temporarily unavailable. Please choose cash on delivery.", "paymentMethod");
    }

    const r = await price(user, address.pincode, input.couponCode ? normalizeCouponCode(input.couponCode) : null, input.paymentMethod);
    if (!r.shipping) throw new CheckoutError("Sorry, we don't deliver to this PIN code yet.", "address.pincode");
    if (input.couponCode && r.couponError) throw new CheckoutError(r.couponError, "couponCode");
    if (input.paymentMethod === "COD" && r.codReason) throw new CheckoutError(r.codReason, "paymentMethod");

    const settings = await getStoreInfo();
    const isCod = input.paymentMethod === "COD";
    const t = r.totals;

    const order = await db.$transaction(async (tx) => {
      const number = await nextOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          number,
          userId: user.id,
          status: isCod ? "CONFIRMED" : "PENDING_PAYMENT",
          paymentMethod: input.paymentMethod,
          subtotal: t.subtotal,
          discountTotal: t.discountTotal,
          shippingTotal: t.shippingTotal,
          codFee: t.codFee,
          taxTotal: t.taxTotal,
          grandTotal: t.grandTotal,
          couponCode: r.coupon?.code ?? null,
          email,
          phone: address.phone,
          shippingAddress: address,
          addFallPico: input.addFallPico,
          giftWrap: input.giftWrap,
          giftMessage: input.giftWrap ? input.giftMessage || null : null,
          customerNote: input.customerNote || null,
          expiresAt: isCod ? null : new Date(Date.now() + settings.orderHoldMinutes * 60_000),
          items: {
            create: t.lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId,
              productName: l.name,
              sku: l.sku,
              image: l.image,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
              lineTotal: l.lineTotal - l.discount,
              hsnCode: l.hsnCode,
              gstRateBps: l.gstRateBps,
              taxAmount: l.taxAmount,
            })),
          },
          history: { create: { toStatus: isCod ? "CONFIRMED" : "PENDING_PAYMENT", actorId: user.id, note: "Order placed" } },
          payments: { create: { provider: isCod ? "cod" : "razorpay", amount: t.grandTotal } },
        },
      });

      await reserveStock(tx, created.id, t.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, sku: l.sku, name: l.name })));
      if (r.coupon) await redeemCoupon(tx, r.coupon.id, user.id, created.id, t.discountTotal);

      if (input.saveAddress && input.address) {
        const hasDefault = await tx.address.count({ where: { userId: user.id, isDefault: true } });
        await tx.address.create({
          data: { userId: user.id, ...input.address, line2: input.address.line2 || null, landmark: input.address.landmark || null, isDefault: hasDefault === 0 },
        });
      }
      await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
      return created;
    });

    if (isCod) {
      await enqueue("order.placed", { orderId: order.id });
      return { orderId: order.id, number: order.number, paymentMethod: "COD" };
    }

    try {
      const rzpOrder = await createRazorpayOrder({ amount: order.grandTotal, receipt: order.number, orderId: order.id });
      await db.payment.updateMany({ where: { orderId: order.id, provider: "razorpay" }, data: { providerOrderId: rzpOrder.id } });
      await enqueue("order.expire", { orderId: order.id }, { delay: settings.orderHoldMinutes * 60_000 + 5_000, jobId: `expire-${order.id}` });
      return {
        orderId: order.id,
        number: order.number,
        paymentMethod: "RAZORPAY",
        razorpay: {
          keyId: razorpayKeyId(),
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          prefill: { name: address.fullName, email: email ?? undefined, contact: address.phone },
        },
      };
    } catch (err) {
      logger.error({ ...errorInfo(err), orderId: order.id }, "could not create razorpay order; cancelling");
      await transitionOrder(order.id, "CANCELLED", { note: "Payment gateway unavailable" }).catch(() => undefined);
      throw new CheckoutError("We couldn't reach the payment gateway. Your bag has been kept — please try again.");
    }
  } finally {
    await redis().del(lockKey);
  }
}

/** Re-opens payment for an order still awaiting it (e.g. the customer closed the Razorpay window). */
export async function resumePayment(user: SessionUser, orderId: string): Promise<PlacedOrder> {
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { payments: true } });
  if (!order || order.status !== "PENDING_PAYMENT") throw new CheckoutError("This order is no longer awaiting payment.");
  const payment = order.payments.find((p) => p.provider === "razorpay" && p.providerOrderId);
  if (!payment?.providerOrderId) throw new CheckoutError("Payment can't be resumed for this order.");
  const address = order.shippingAddress as { fullName: string; phone: string };
  return {
    orderId: order.id,
    number: order.number,
    paymentMethod: "RAZORPAY",
    razorpay: {
      keyId: razorpayKeyId(),
      orderId: payment.providerOrderId,
      amount: payment.amount,
      currency: "INR",
      prefill: { name: address.fullName, email: isPlaceholderEmail(order.email) ? undefined : order.email, contact: address.phone },
    },
  };
}
