import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { closeQueues } from "@/server/queue";
import { redis } from "@/server/redis";
import { placeOrder, CheckoutError } from "@/server/services/checkout";
import { expireOrder, markRazorpayPaid, transitionOrder, nextOrderNumber } from "@/server/services/orders";
import { reserveStock, OutOfStockError } from "@/server/services/inventory";
import { addItem, getCart, mergeAnonymousCart } from "@/server/services/cart";
import { hmacHex } from "@/server/services/payments/razorpay";
import { POST as razorpayWebhook } from "@/app/api/webhooks/razorpay/route";
import { fillCart, makeProduct, makeUser, resetState, seedShipping, testAddress } from "./helpers";

const checkoutInput = (over: Record<string, unknown> = {}) => ({
  address: testAddress,
  saveAddress: true,
  paymentMethod: "COD" as const,
  addFallPico: false,
  giftWrap: false,
  ...over,
});

/** Creates an order awaiting online payment, with stock reserved, bypassing the Razorpay API. */
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

beforeEach(async () => {
  await resetState();
  await seedShipping();
});

afterAll(async () => {
  await closeQueues();
  await redis().quit();
  await db.$disconnect();
});

describe("cash on delivery checkout", () => {
  it("creates a confirmed order, reserves stock, clears the cart and saves the address", async () => {
    const { variant } = await makeProduct({ stock: 3, price: 4_500_000 });
    const user = await makeUser();
    await fillCart(user.id, variant.id, 2);

    const placed = await placeOrder(user, checkoutInput());
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.orderId }, include: { items: true, history: true } });

    expect(order.status).toBe("CONFIRMED");
    expect(order.number).toMatch(/^NCS-\d{4}-\d{6}$/);
    expect(order.grandTotal).toBe(9_000_000);
    expect(order.taxTotal).toBe(428_571); // 5% GST contained in ₹90,000
    expect(order.items[0].quantity).toBe(2);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(1);
    expect(await db.cartItem.count()).toBe(0);
    expect(await db.address.count({ where: { userId: user.id } })).toBe(1);
    expect(await db.inventoryMovement.count({ where: { orderId: order.id, reason: "ORDER_RESERVED" } })).toBe(1);
  });

  it("requires a verified phone for COD", async () => {
    const { variant } = await makeProduct();
    const user = await makeUser({ phoneVerified: false });
    await fillCart(user.id, variant.id);
    await expect(placeOrder(user, checkoutInput())).rejects.toThrow(/Verify your mobile/);
  });

  it("rejects online payment when Razorpay isn't configured", async () => {
    const { variant } = await makeProduct();
    const user = await makeUser();
    await fillCart(user.id, variant.id);
    await expect(placeOrder(user, checkoutInput({ paymentMethod: "RAZORPAY" }))).rejects.toBeInstanceOf(CheckoutError);
  });

  it("re-prices from the database instead of trusting the cart", async () => {
    const { variant } = await makeProduct({ price: 1_000_000 });
    const user = await makeUser();
    await fillCart(user.id, variant.id);
    await db.productVariant.update({ where: { id: variant.id }, data: { price: 2_000_000 } });
    const placed = await placeOrder(user, checkoutInput());
    expect((await db.order.findUniqueOrThrow({ where: { id: placed.orderId } })).grandTotal).toBe(2_000_000);
  });

  it("applies a coupon once and enforces its global usage limit", async () => {
    const { variant } = await makeProduct({ stock: 10, price: 1_000_000 });
    await db.coupon.create({ data: { code: "ONCE", type: "PERCENT", value: 1000, usageLimit: 1, perUserLimit: 1 } });
    const a = await makeUser();
    const b = await makeUser();
    await fillCart(a.id, variant.id);
    await fillCart(b.id, variant.id);

    const placed = await placeOrder(a, checkoutInput({ couponCode: "once" }));
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.orderId } });
    expect(order.discountTotal).toBe(100_000);
    expect(order.grandTotal).toBe(900_000);
    await expect(placeOrder(b, checkoutInput({ couponCode: "ONCE" }))).rejects.toThrow(/fully redeemed/);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "ONCE" } })).usedCount).toBe(1);
  });
});

describe("stock safety", () => {
  it("never oversells the last piece under concurrent checkouts", async () => {
    const { variant } = await makeProduct({ stock: 1 });
    const buyers = await Promise.all(Array.from({ length: 5 }, () => makeUser()));
    for (const u of buyers) await fillCart(u.id, variant.id);

    const results = await Promise.allSettled(buyers.map((u) => placeOrder(u, checkoutInput())));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(0);
    expect(await db.order.count()).toBe(1);
  });

  it("returns stock and coupon uses when an order is cancelled", async () => {
    const { variant } = await makeProduct({ stock: 2 });
    await db.coupon.create({ data: { code: "BACK", type: "FIXED", value: 10_000, usageLimit: 5 } });
    const user = await makeUser();
    await fillCart(user.id, variant.id, 2);
    const placed = await placeOrder(user, checkoutInput({ couponCode: "BACK" }));

    await transitionOrder(placed.orderId, "CANCELLED", { note: "test" });
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(2);
    expect((await db.coupon.findUniqueOrThrow({ where: { code: "BACK" } })).usedCount).toBe(0);
    await expect(transitionOrder(placed.orderId, "CONFIRMED")).rejects.toThrow();
  });

  it("refuses stock reservations beyond what is available", async () => {
    const { variant } = await makeProduct({ stock: 1 });
    const user = await makeUser();
    const { order } = await pendingOnlineOrder(variant.id, user.id, 100_000);
    await expect(db.$transaction((tx) => reserveStock(tx, order.id, [{ variantId: variant.id, quantity: 1, sku: "T", name: "Test" }]))).rejects.toBeInstanceOf(OutOfStockError);
  });
});

describe("online payments", () => {
  it("confirms an order exactly once even if the payment is reported twice", async () => {
    const { variant } = await makeProduct({ stock: 2 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 4_500_000);

    await Promise.all([
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_1" }),
      markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_1" }),
    ]).catch(() => undefined);
    await markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_1" });

    const after = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { history: true, payments: true } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.paymentStatus).toBe("PAID");
    expect(after.history.filter((h) => h.toStatus === "CONFIRMED")).toHaveLength(1);
    expect(after.payments[0].providerPaymentId).toBe("pay_1");
  });

  it("expires unpaid orders and releases their stock", async () => {
    const { variant } = await makeProduct({ stock: 1 });
    const user = await makeUser();
    const { order } = await pendingOnlineOrder(variant.id, user.id, 100_000, new Date(Date.now() - 1000));
    expect(await expireOrder(order.id)).toBe(true);
    expect((await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(1);
  });

  it("restores an expired order when a late payment arrives and stock is still available", async () => {
    const { variant } = await makeProduct({ stock: 1 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 100_000, new Date(Date.now() - 1000));
    await expireOrder(order.id);
    await markRazorpayPaid({ razorpayOrderId: rzpOrderId, razorpayPaymentId: "pay_late" });
    const after = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.status).toBe("CONFIRMED");
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(0);
  });

  it("webhook: rejects bad signatures and processes each event once", async () => {
    const { variant } = await makeProduct({ stock: 1 });
    const user = await makeUser();
    const { order, rzpOrderId } = await pendingOnlineOrder(variant.id, user.id, 100_000);
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_wh", order_id: rzpOrderId, method: "upi" } } } });
    const send = (signature: string) =>
      razorpayWebhook(new Request("http://localhost/api/webhooks/razorpay", { method: "POST", body, headers: { "x-razorpay-signature": signature, "x-razorpay-event-id": "evt_1" } }));

    expect((await send("forged")).status).toBe(400);
    const sig = hmacHex("test_webhook_secret", body);
    expect((await send(sig)).status).toBe(200);
    const dup = await send(sig);
    expect(await dup.json()).toMatchObject({ duplicate: true });

    const after = await db.order.findUniqueOrThrow({ where: { id: order.id }, include: { payments: true } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.payments[0].method).toBe("upi");
  });
});

describe("cart", () => {
  it("limits quantities to stock and merges a guest cart into the account cart", async () => {
    const { variant } = await makeProduct({ stock: 2 });
    const guest = await addItem({ userId: null, anonymousId: null }, variant.id, 1);
    expect(guest.anonymousId).toBeTruthy();
    const second = await addItem({ userId: null, anonymousId: guest.anonymousId }, variant.id, 5);
    expect(second.cart.lines[0].quantity).toBe(2);

    const user = await makeUser();
    await mergeAnonymousCart(user.id, guest.anonymousId!);
    const merged = await getCart({ userId: user.id, anonymousId: null });
    expect(merged.itemCount).toBe(2);
    expect(await db.cart.count({ where: { anonymousId: guest.anonymousId } })).toBe(0);
  });
});
