import { db, type Prisma, type Tx } from "../db";
import type { OrderStatus } from "@/generated/prisma/enums";
import { enqueue } from "../queue";
import { logger, errorInfo } from "../logger";
import { releaseStock, reserveStock, OutOfStockError } from "./inventory";
import { releaseCoupon } from "./coupons";
import { refundPayment } from "./payments/razorpay";

export class OrderError extends Error {}

/** Allowed lifecycle transitions. Anything else is rejected. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => ORDER_TRANSITIONS[from].includes(to);

/** Statuses whose stock is still held by the order (released on cancellation). */
const HOLDS_STOCK: OrderStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING"];

export const RETURN_WINDOW_DAYS = 7;

export function withinReturnWindow(deliveredAt: Date | null | undefined, now = new Date()): boolean {
  return deliveredAt != null && now.getTime() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 86_400_000;
}

export async function nextOrderNumber(tx: Tx): Promise<string> {
  const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_number_seq') AS n`;
  return `NCS-${new Date().getFullYear()}-${String(n).padStart(6, "0")}`;
}

interface TransitionOptions {
  actorId?: string | null;
  note?: string;
  data?: Prisma.OrderUpdateManyMutationInput;
}

/**
 * Moves an order to a new status inside `tx` with compare-and-set semantics, applying
 * stock/coupon side effects. Callers enqueue notifications after the transaction commits.
 */
export async function transitionInTx(tx: Tx, orderId: string, to: OrderStatus, opts: TransitionOptions = {}) {
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) throw new OrderError("Order not found.");
  const from = order.status;
  if (!canTransition(from, to)) throw new OrderError(`Can't move an order from ${from} to ${to}.`);

  const { count } = await tx.order.updateMany({
    where: { id: orderId, status: from },
    data: {
      status: to,
      ...(to === "CANCELLED" ? { cancelledAt: new Date(), cancelReason: opts.note ?? null, expiresAt: null } : {}),
      ...opts.data,
    },
  });
  if (count !== 1) throw new OrderError("The order was updated by someone else — please refresh and try again.");

  if (to === "CANCELLED" && HOLDS_STOCK.includes(from)) {
    await releaseStock(tx, orderId);
    await releaseCoupon(tx, orderId);
  }
  if (to === "RETURNED") await releaseStock(tx, orderId, "ORDER_RETURNED");
  if (to === "DELIVERED" && from === "SHIPPED") {
    await tx.shipment.updateMany({ where: { orderId }, data: { deliveredAt: new Date() } });
    // Cash on delivery is collected at the door.
    const cod = await tx.payment.findFirst({ where: { orderId, provider: "cod", status: "PENDING" } });
    if (cod) {
      await tx.payment.update({ where: { id: cod.id }, data: { status: "PAID" } });
      await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" } });
    }
  }

  await tx.orderStatusHistory.create({
    data: { orderId, fromStatus: from, toStatus: to, note: opts.note, actorId: opts.actorId ?? null },
  });
  return { from, to };
}

export async function transitionOrder(orderId: string, to: OrderStatus, opts: TransitionOptions = {}) {
  const result = await db.$transaction((tx) => transitionInTx(tx, orderId, to, opts));
  await enqueue("order.status-changed", { orderId, status: to });
  return result;
}

// ─── Payments ───

/** Idempotently records a captured Razorpay payment (called from the checkout callback and the webhook). */
export async function markRazorpayPaid(input: { razorpayOrderId: string; razorpayPaymentId: string; method?: string | null }) {
  const payment = await db.payment.findUnique({
    where: { providerOrderId: input.razorpayOrderId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) throw new OrderError(`Unknown Razorpay order ${input.razorpayOrderId}`);
  if (payment.status === "PAID" || payment.status === "REFUNDED") return { orderId: payment.orderId, changed: false };

  const order = payment.order;
  let lateAndUnfulfillable = false;

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", providerPaymentId: input.razorpayPaymentId, method: input.method ?? null, errorReason: null },
    });

    if (order.status === "PENDING_PAYMENT") {
      await transitionInTx(tx, order.id, "CONFIRMED", { note: "Payment received", data: { paymentStatus: "PAID", expiresAt: null } });
      return;
    }

    if (order.status === "CANCELLED") {
      // Payment arrived after the hold expired: try to re-reserve, otherwise refund below.
      try {
        await reserveStock(
          tx,
          order.id,
          order.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity, sku: i.sku, name: i.productName })),
        );
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CONFIRMED", paymentStatus: "PAID", cancelledAt: null, cancelReason: null },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: "CANCELLED", toStatus: "CONFIRMED", note: "Late payment received; order restored" },
        });
      } catch (err) {
        if (!(err instanceof OutOfStockError)) throw err;
        lateAndUnfulfillable = true;
      }
      return;
    }

    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
  });

  if (lateAndUnfulfillable) {
    logger.warn({ orderId: order.id }, "late payment for an expired order with no stock; refunding");
    await refundOrder(order.id, { reason: "Order expired before payment and the item is no longer available" });
    return { orderId: order.id, changed: true };
  }

  await enqueue("order.placed", { orderId: order.id });
  return { orderId: order.id, changed: true };
}

export async function recordPaymentFailure(razorpayOrderId: string, reason: string) {
  await db.payment.updateMany({
    where: { providerOrderId: razorpayOrderId, status: "PENDING" },
    data: { errorReason: reason.slice(0, 500) },
  });
}

/** Cancels an unpaid order once its payment hold has lapsed (scheduled job). */
export async function expireOrder(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true, expiresAt: true } });
  if (!order || order.status !== "PENDING_PAYMENT") return false;
  if (order.expiresAt && order.expiresAt > new Date()) return false;
  try {
    await transitionOrder(orderId, "CANCELLED", { note: "Payment not completed in time" });
    return true;
  } catch (err) {
    if (err instanceof OrderError) return false; // raced with a payment — fine
    throw err;
  }
}

/** Refunds the online payment for an order (full by default). COD refunds are recorded as manual. */
export async function refundOrder(orderId: string, opts: { amount?: number; reason: string; actorId?: string | null }) {
  const payment = await db.payment.findFirst({
    where: { orderId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
    include: { refunds: true },
  });
  if (!payment) return null;

  const refunded = payment.refunds.filter((r) => r.status !== "failed").reduce((a, r) => a + r.amount, 0);
  const remaining = payment.amount - refunded;
  const amount = Math.min(opts.amount ?? remaining, remaining);
  if (amount <= 0) throw new OrderError("Nothing left to refund.");

  let providerRefundId: string | null = null;
  let status = "manual";
  if (payment.provider === "razorpay" && payment.providerPaymentId) {
    try {
      const r = await refundPayment(payment.providerPaymentId, amount, opts.reason);
      providerRefundId = r.id;
      status = r.status;
    } catch (err) {
      logger.error({ ...errorInfo(err), orderId }, "razorpay refund failed");
      await db.refund.create({ data: { paymentId: payment.id, amount, status: "failed", reason: opts.reason, actorId: opts.actorId ?? null } });
      throw new OrderError("The refund could not be processed by Razorpay. Please retry from the dashboard.");
    }
  }

  const fully = refunded + amount >= payment.amount;
  await db.$transaction([
    db.refund.create({ data: { paymentId: payment.id, providerRefundId, amount, status, reason: opts.reason, actorId: opts.actorId ?? null } }),
    db.payment.update({ where: { id: payment.id }, data: { status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED" } }),
    db.order.update({ where: { id: orderId }, data: { paymentStatus: fully ? "REFUNDED" : "PARTIALLY_REFUNDED" } }),
  ]);
  return { amount, status };
}

// ─── Customer actions ───

export async function cancelOrderByCustomer(userId: string, orderId: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new OrderError("Order not found.");
  if (order.status !== "CONFIRMED" && order.status !== "PENDING_PAYMENT") {
    throw new OrderError("This order is already being prepared and can no longer be cancelled online. Please contact us.");
  }
  await transitionOrder(orderId, "CANCELLED", { actorId: userId, note: "Cancelled by customer" });
  if (order.paymentStatus === "PAID") await refundOrder(orderId, { reason: "Cancelled by customer", actorId: userId });
}

export async function requestReturn(userId: string, orderId: string, reason: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId }, include: { shipment: true } });
  if (!order) throw new OrderError("Order not found.");
  if (order.status !== "DELIVERED") throw new OrderError("Returns can be requested once the order is delivered.");
  if (order.addFallPico) {
    throw new OrderError("Sarees customised with fall & pico can't be returned (see our returns policy).");
  }
  const deliveredAt = order.shipment?.deliveredAt ?? order.updatedAt;
  if (Date.now() - deliveredAt.getTime() > RETURN_WINDOW_DAYS * 24 * 3600 * 1000) {
    throw new OrderError(`The ${RETURN_WINDOW_DAYS}-day return window for this order has closed.`);
  }
  await transitionOrder(orderId, "RETURN_REQUESTED", { actorId: userId, note: reason.slice(0, 500) });
}

// ─── Queries ───

export function getOrderForUser(userId: string, orderId: string) {
  return db.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, shipment: true, history: { orderBy: { createdAt: "asc" } }, payments: true },
  });
}

export function listOrdersForUser(userId: string) {
  return db.order.findMany({
    where: { userId },
    include: { items: { select: { productName: true, image: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
