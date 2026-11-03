import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { env, features } from "../../env";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

let client: Razorpay | undefined;

/** The SDK exposes no timeout option, but it is a thin axios wrapper: set the default on its instance. */
function withTimeout(c: Razorpay): Razorpay {
  const rq = (c as unknown as { api?: { rq?: { defaults?: { timeout?: number } } } }).api?.rq;
  if (rq?.defaults) rq.defaults.timeout = REQUEST_TIMEOUT_MS;
  return c;
}

function rzp(extraHeaders?: Record<string, string>): Razorpay {
  if (!features.razorpay()) throw new Error("Razorpay is not configured");
  const creds = { key_id: env().RAZORPAY_KEY_ID!, key_secret: env().RAZORPAY_KEY_SECRET! };
  if (extraHeaders) return withTimeout(new Razorpay({ ...creds, headers: extraHeaders }));
  client ??= withTimeout(new Razorpay(creds));
  return client;
}

/** Network errors, timeouts, 429 and 5xx are worth retrying; 4xx validation errors are not. */
export function isRetryableRazorpayError(err: unknown): boolean {
  const status = (err as { statusCode?: number } | null)?.statusCode;
  if (typeof status !== "number") return true;
  return status === 429 || status >= 500;
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = MAX_ATTEMPTS, baseDelayMs = 300): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (i === attempts || !isRetryableRazorpayError(err)) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** (i - 1)));
    }
  }
  throw last;
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

/** Creating an order is safe to retry: the worst case is an unused stray Razorpay order. */
export async function createRazorpayOrder(input: { amount: number; receipt: string; orderId: string }) {
  const order = await withRetry(() =>
    rzp().orders.create({ amount: input.amount, currency: "INR", receipt: input.receipt, notes: { orderId: input.orderId } }),
  );
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

/**
 * `idempotencyKey` (our refund row id) is sent as Razorpay's X-Refund-Idempotency header, so a retried
 * call after a timeout cannot refund twice. It is also stored in the refund notes for reconciliation.
 */
export async function refundPayment(paymentId: string, amount: number, note: string, idempotencyKey?: string) {
  // Without an idempotency key a retry could double-refund, so only retry when we have one.
  const refund = await withRetry(
    () =>
      (idempotencyKey ? rzp({ "X-Refund-Idempotency": idempotencyKey }) : rzp()).payments.refund(paymentId, {
        amount,
        receipt: idempotencyKey,
        notes: { reason: note.slice(0, 250), ...(idempotencyKey ? { refundRowId: idempotencyKey } : {}) },
      }),
    idempotencyKey ? MAX_ATTEMPTS : 1,
  );
  return { id: refund.id, status: refund.status, amount: Number(refund.amount) };
}

export async function fetchPayment(paymentId: string) {
  const p = await withRetry(() => rzp().payments.fetch(paymentId));
  return { id: p.id, orderId: p.order_id, status: p.status, method: p.method, amount: Number(p.amount) };
}
