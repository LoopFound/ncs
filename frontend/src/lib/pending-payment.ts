import type { PlacedOrder, RazorpayPaymentResponse } from "@/lib/api";

/**
 * A Razorpay order already created on the server, plus the payment response once Razorpay
 * reports success. Kept in sessionStorage (per user) so a reload resumes this order or
 * re-checks this payment instead of letting the customer place and pay for a second one.
 */
export interface PendingPayment {
    order: PlacedOrder;
    response?: RazorpayPaymentResponse;
}

const KEY_PREFIX = "ncs_pending_payment:";

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

function isPendingPayment(value: unknown): value is PendingPayment {
    if (typeof value !== "object" || value === null) return false;
    const { order, response } = value as Record<string, unknown>;
    if (typeof order !== "object" || order === null) return false;
    const o = order as Record<string, unknown>;
    const rp = o.razorpay as Record<string, unknown> | undefined;
    if (!isString(o.orderId) || !isString(o.number) || o.paymentMethod !== "RAZORPAY") return false;
    if (!rp || !isString(rp.keyId) || !isString(rp.orderId) || typeof rp.amount !== "number" || !isString(rp.currency)) return false;
    if (response === undefined) return true;
    if (typeof response !== "object" || response === null) return false;
    const r = response as Record<string, unknown>;
    return isString(r.razorpay_order_id) && isString(r.razorpay_payment_id) && isString(r.razorpay_signature);
}

export function parsePendingPayment(raw: string | null): PendingPayment | null {
    if (!raw) return null;
    try {
        const parsed: unknown = JSON.parse(raw);
        return isPendingPayment(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function readPendingPayment(userId: string): PendingPayment | null {
    try {
        return parsePendingPayment(sessionStorage.getItem(KEY_PREFIX + userId));
    } catch {
        return null;
    }
}

export function writePendingPayment(userId: string, value: PendingPayment | null) {
    try {
        if (value) sessionStorage.setItem(KEY_PREFIX + userId, JSON.stringify(value));
        else sessionStorage.removeItem(KEY_PREFIX + userId);
    } catch {
        // Storage blocked: the in-memory copy still protects this page view.
    }
}
