import { afterEach, describe, expect, it, vi } from "vitest";
import { parsePendingPayment, readPendingPayment, writePendingPayment, type PendingPayment } from "./pending-payment";

const pending: PendingPayment = {
    order: {
        orderId: "ord_1",
        number: "NCS-2026-000123",
        paymentMethod: "RAZORPAY",
        razorpay: { keyId: "rzp_test", orderId: "order_abc", amount: 4_500_000, currency: "INR", prefill: { name: "Radhika", contact: "+919876543210" } },
    },
};
const captured: PendingPayment = {
    ...pending,
    response: { razorpay_order_id: "order_abc", razorpay_payment_id: "pay_1", razorpay_signature: "sig" },
};

function memoryStorage() {
    const data = new Map<string, string>();
    return {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
    };
}

afterEach(() => vi.unstubAllGlobals());

describe("parsePendingPayment", () => {
    it("restores an order awaiting payment and a captured payment", () => {
        expect(parsePendingPayment(JSON.stringify(pending))).toEqual(pending);
        expect(parsePendingPayment(JSON.stringify(captured))).toEqual(captured);
    });

    it.each([
        ["missing", null],
        ["malformed", "{oops"],
        ["COD order", JSON.stringify({ order: { ...pending.order, paymentMethod: "COD" } })],
        ["no Razorpay params", JSON.stringify({ order: { ...pending.order, razorpay: undefined } })],
        ["partial response", JSON.stringify({ ...pending, response: { razorpay_order_id: "order_abc" } })],
    ])("ignores %s", (_label, raw) => {
        expect(parsePendingPayment(raw)).toBeNull();
    });
});

describe("per-user storage", () => {
    it("keeps each user's pending payment separate and clears it", () => {
        vi.stubGlobal("sessionStorage", memoryStorage());
        writePendingPayment("u1", captured);
        expect(readPendingPayment("u1")).toEqual(captured);
        expect(readPendingPayment("u2")).toBeNull();
        writePendingPayment("u1", null);
        expect(readPendingPayment("u1")).toBeNull();
    });

    it("survives blocked storage", () => {
        vi.stubGlobal("sessionStorage", {
            getItem: () => {
                throw new Error("denied");
            },
            setItem: () => {
                throw new Error("denied");
            },
        });
        expect(() => writePendingPayment("u1", pending)).not.toThrow();
        expect(readPendingPayment("u1")).toBeNull();
    });
});
