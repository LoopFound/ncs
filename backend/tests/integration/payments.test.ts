import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const rz = vi.hoisted(() => ({ refundPayment: vi.fn() }));
vi.mock("@/server/services/payments/razorpay", async (orig) => ({
  ...(await orig<typeof import("@/server/services/payments/razorpay")>()),
  refundPayment: rz.refundPayment,
}));

import { db } from "@/server/db";
import { closeQueues } from "@/server/queue";
import { redis } from "@/server/redis";
import { cancelOrderByCustomer, expireOrder, markRazorpayPaid, nextOrderNumber, recordRefundOutcome, refundOrder } from "@/server/services/orders";
import { reserveStock } from "@/server/services/inventory";
import { makeProduct, makeUser, resetState, seedShipping, testAddress } from "./helpers";

async function pendingOnlineOrder(variantId: string, userId: string, amount: number, expiresAt = new Date(Date.now() + 30 * 60_000)) {
  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: await nextOrderNumber(tx),
        userId,
        status: "PENDING_PAYMENT",
        paymentMethod: "RAZORPAY",
        subtotal: amount,
        taxTotal: 0,
        grandTotal: amount,
        email: "c@example.com",
        phone: testAddress.phone,
        shippingAddress: testAddress,
        expiresAt,
        items: { create: { variantId, productName: "Test", sku: "T", unitPrice: amount, quantity: 1, lineTotal: amount, hsnCode: "5007", gstRateBps: 500, taxAmount: 0 } },
        payments: { create: { provider: "razorpay", amount, providerOrderId: `order_${Math.random().toString(36).slice(2)}` } },
      },
      include: { payments: true },
    });
    await reserveStock(tx, created.id, [{ variantId, quantity: 1, sku: "T", name: "Test" }]);
    return created;
  });
  return { order, rzpOrderId: order.payments[0].providerOrderId! };
}

const stock = async (variantId: string) => (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

beforeEach(async () => {
  await resetState();
  await seedShipping();
  rz.refundPayment.mockReset();
  rz.refundPayment.mockImplementation(async (_p: string, amount: number) => ({ id: `rfnd_${Math.random().toString(36).slice(2)}`, status: "processed", amount }));
});

afterAll(async () => {
  await closeQueues();
  await redis().quit();
  await db.$disconnect();
});

describe("markRazorpayPaid races", () => {
  it("applies a payment once under concurrent callback + webhook", async () => {
    const { variant } = await makeProduct({ stock: 2 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 100_000);
    const results = await Promise.allSettled([
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_a" }),
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_a" }),
    ]);
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { history: true } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.history.filter((h) => h.toStatus === "CONFIRMED")).toHaveLength(1);
  });

  it("reserves stock only once when a late payment is reported concurrently", async () => {
    const { variant } = await makeProduct({ stock: 3 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 100_000, new Date(Date.now() - 1000));
    await expireOrder(order.id);
    expect(await stock(variant.id)).toBe(3);
    await Promise.allSettled([
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_l" }),
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_l" }),
    ]);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CONFIRMED");
    expect(await stock(variant.id)).toBe(2);
  });
});

describe("late payment with no stock", () => {
  async function lateNoStock() {
    const { variant } = await makeProduct({ stock: 1 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 100_000, new Date(Date.now() - 1000));
    await expireOrder(order.id);
    await db.productVariant.update({ where: { id: variant.id }, data: { stock: 0 } });
    return { order, rzpOrderId, variant };
  }

  it("refunds and leaves no partial stock reservation", async () => {
    const { order, rzpOrderId, variant } = await lateNoStock();
    await markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_x" });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: { include: { refunds: true } } } });
    expect(after.status).toBe("CANCELLED");
    expect(after.paymentStatus).toBe("REFUNDED");
    expect(after.payments[0].refunds).toHaveLength(1);
    expect(await stock(variant.id)).toBe(0);
  });

  it("keeps a durable refund-needed state when the refund fails, and a retried event completes it", async () => {
    const { order, rzpOrderId } = await lateNoStock();
    rz.refundPayment.mockRejectedValueOnce(Object.assign(new Error("gateway rejected"), { statusCode: 400 }));
    await expect(markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_x" })).rejects.toThrow();

    const mid = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(mid.status).toBe("CANCELLED");
    expect(mid.payments[0].status).toBe("PAID");

    const retry = await markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_x" });
    expect(retry.changed).toBe(false);
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(after.payments[0].status).toBe("REFUNDED");
    expect(after.paymentStatus).toBe("REFUNDED");
  });
});

describe("refundOrder", () => {
  async function paidOrder(amount = 100_000) {
    const { variant } = await makeProduct({ stock: 2 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, amount);
    await markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_r" });
    return { order, user };
  }

  it("never refunds more than the payment under concurrent calls", async () => {
    const { order } = await paidOrder();
    const results = await Promise.allSettled([
      refundOrder(order.id, { reason: "a" }),
      refundOrder(order.id, { reason: "b" }),
      refundOrder(order.id, { reason: "c" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled" && r.value).length).toBe(1);
    expect(rz.refundPayment).toHaveBeenCalledTimes(1);
    const refunds = await db.refund.findMany({ where: { payment: { orderId: order.id } } });
    expect(refunds.reduce((a, r) => a + r.amount, 0)).toBe(100_000);
  });

  it("passes the refund row id as the idempotency key", async () => {
    const { order } = await paidOrder();
    await refundOrder(order.id, { reason: "x", amount: 40_000 });
    const [refund] = await db.refund.findMany({ where: { payment: { orderId: order.id } } });
    expect(rz.refundPayment).toHaveBeenCalledWith(expect.any(String), 40_000, "x", refund.id);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PARTIALLY_REFUNDED");
  });

  it("frees the balance when Razorpay fails so the refund can be retried", async () => {
    const { order } = await paidOrder();
    rz.refundPayment.mockRejectedValueOnce(Object.assign(new Error("bad request"), { statusCode: 400 }));
    await expect(refundOrder(order.id, { reason: "x" })).rejects.toThrow();
    await expect(refundOrder(order.id, { reason: "x" })).resolves.toMatchObject({ amount: 100_000 });
  });

  it("keeps the refund pending (balance reserved) when Razorpay times out, so it is never re-sent", async () => {
    const { order } = await paidOrder();
    rz.refundPayment.mockRejectedValueOnce(new Error("socket timeout"));
    await expect(refundOrder(order.id, { reason: "x" })).rejects.toThrow(/timed out/);
    const row = await db.refund.findFirstOrThrow({ where: { payment: { orderId: order.id } } });
    expect(row.status).toBe("pending");
    await expect(refundOrder(order.id, { reason: "x" })).rejects.toThrow(/Nothing left/);
    expect(rz.refundPayment).toHaveBeenCalledTimes(1);
  });

  it("rolls payment status back on refund.failed", async () => {
    const { order } = await paidOrder();
    await refundOrder(order.id, { reason: "x" });
    const refund = await db.refund.findFirstOrThrow({ where: { payment: { orderId: order.id } } });
    expect(await recordRefundOutcome(refund.providerRefundId!, "failed")).toBe(1);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PAID");
    expect(await recordRefundOutcome("rfnd_unknown", "failed")).toBe(0);
  });

  it("customer cancellation keeps the order cancelled and retriable when the refund fails", async () => {
    const { order, user } = await paidOrder();
    rz.refundPayment.mockRejectedValueOnce(Object.assign(new Error("bad request"), { statusCode: 400 }));
    await cancelOrderByCustomer(user.id, order.id);
    const mid = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(mid.status).toBe("CANCELLED");
    expect(mid.payments[0].status).toBe("PAID");
    await refundOrder(order.id, { reason: "retry" });
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("REFUNDED");
  });
});
