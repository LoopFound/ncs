import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { env, features } from "../../env";

let client: Razorpay | undefined;

function rzp(): Razorpay {
  if (!features.razorpay()) throw new Error("Razorpay is not configured");
  client ??= new Razorpay({ key_id: env().RAZORPAY_KEY_ID!, key_secret: env().RAZORPAY_KEY_SECRET! });
  return client;
}

export function razorpayKeyId(): string {
  return env().RAZORPAY_KEY_ID!;
}

function safeEqualHex(expectedHex: string, actual: string): boolean {
  const a = Buffer.from(expectedHex, "utf8");
  const b = Buffer.from(actual ?? "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function hmacHex(secret: string, payload: string | Buffer): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Checkout callback signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string, secret = env().RAZORPAY_KEY_SECRET!): boolean {
  return safeEqualHex(hmacHex(secret, `${razorpayOrderId}|${razorpayPaymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, secret = env().RAZORPAY_WEBHOOK_SECRET): boolean {
  if (!secret) return false;
  return safeEqualHex(hmacHex(secret, rawBody), signature);
}

export async function createRazorpayOrder(input: { amount: number; receipt: string; orderId: string }) {
  const order = await rzp().orders.create({
    amount: input.amount,
    currency: "INR",
    receipt: input.receipt,
    notes: { orderId: input.orderId },
  });
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

export async function refundPayment(paymentId: string, amount: number, note: string) {
  const refund = await rzp().payments.refund(paymentId, { amount, notes: { reason: note.slice(0, 250) } });
  return { id: refund.id, status: refund.status, amount: Number(refund.amount) };
}

export async function fetchPayment(paymentId: string) {
  const p = await rzp().payments.fetch(paymentId);
  return { id: p.id, orderId: p.order_id, status: p.status, method: p.method, amount: Number(p.amount) };
}
