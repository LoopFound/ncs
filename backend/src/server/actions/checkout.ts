"use server";

import { z } from "zod";
import { checkoutSchema, pincode } from "@/lib/validation";
import { assertUser } from "../session";
import { db } from "../db";
import { rateLimit } from "../rate-limit";
import { CheckoutError, placeOrder, quoteCheckout, resumePayment, type CheckoutQuote, type PlacedOrder } from "../services/checkout";
import { cancelOrderByCustomer, markRazorpayPaid, OrderError, requestReturn } from "../services/orders";
import { verifyPaymentSignature } from "../services/payments/razorpay";
import { run, type ActionResult } from "./result";

const quoteInput = z.object({
  pincode: pincode.optional().or(z.literal("")),
  couponCode: z.string().trim().max(32).optional().or(z.literal("")),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).optional(),
});

export async function quoteCheckoutAction(input: z.input<typeof quoteInput>): Promise<ActionResult<CheckoutQuote>> {
  return run("checkout.quote", async () => {
    const user = await assertUser();
    const v = quoteInput.parse(input);
    return quoteCheckout(user, { pincode: v.pincode || null, couponCode: v.couponCode || null, paymentMethod: v.paymentMethod });
  });
}

export async function placeOrderAction(input: unknown): Promise<ActionResult<PlacedOrder>> {
  return run("checkout.place", async () => {
    const user = await assertUser();
    const rl = await rateLimit("checkout", user.id, 10, 300);
    if (!rl.ok) throw new CheckoutError("Too many attempts. Please wait a few minutes and try again.");
    return placeOrder(user, checkoutSchema.parse(input));
  });
}

const paymentResult = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/** Called by the browser after Razorpay Checkout succeeds. The webhook confirms independently. */
export async function verifyPaymentAction(input: z.input<typeof paymentResult>): Promise<ActionResult<{ orderId: string }>> {
  return run("checkout.verify", async () => {
    const user = await assertUser();
    const p = paymentResult.parse(input);
    if (!verifyPaymentSignature(p.razorpay_order_id, p.razorpay_payment_id, p.razorpay_signature)) {
      throw new CheckoutError("We couldn't verify this payment. If money was deducted, it will be confirmed automatically or refunded.");
    }
    const payment = await db.payment.findUnique({ where: { providerOrderId: p.razorpay_order_id }, include: { order: { select: { userId: true } } } });
    if (!payment || payment.order.userId !== user.id) throw new OrderError("Order not found.");
    const { orderId } = await markRazorpayPaid({ razorpayOrderId: p.razorpay_order_id, razorpayPaymentId: p.razorpay_payment_id });
    return { orderId };
  });
}

export async function resumePaymentAction(orderId: string): Promise<ActionResult<PlacedOrder>> {
  return run("checkout.resume", async () => resumePayment(await assertUser(), z.string().min(1).parse(orderId)));
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  return run("order.cancel", async () => {
    await cancelOrderByCustomer((await assertUser()).id, z.string().min(1).parse(orderId));
    return undefined;
  });
}

export async function requestReturnAction(orderId: string, reason: string): Promise<ActionResult> {
  return run("order.return", async () => {
    const r = z.string().trim().min(5, "Tell us briefly why you'd like to return it").max(500).parse(reason);
    await requestReturn((await assertUser()).id, z.string().min(1).parse(orderId), r);
    return undefined;
  });
}
