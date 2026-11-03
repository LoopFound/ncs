import { db, type Prisma, type Tx } from "../db";
import type { OrderStatus } from "@/generated/prisma/enums";
import { enqueueSafe } from "../queue";
import { CacheTags, invalidateTags } from "../cache";
import { logger, errorInfo } from "../logger";
import { releaseStock, reserveStock, OutOfStockError } from "./inventory";
import { releaseCoupon } from "./coupons";
import { refundPayment, isRetryableRazorpayError } from "./payments/razorpay";

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

/** Drops cached catalog/product pages whose stock figures just changed. Never throws. */
export async function invalidateStockCache(where: { orderId?: string; productIds?: string[] }) {
  try {
    const productIds =
      where.productIds ??
      (await db.orderItem.findMany({ where: { orderId: where.orderId, productId: { not: null } }, select: { productId: true } })).map((i) => i.productId!);
    const products = productIds.length ? await db.product.findMany({ where: { id: { in: [...new Set(productIds)] } }, select: { slug: true } }) : [];
    await invalidateTags([CacheTags.catalog, ...products.map((p) => CacheTags.product(p.slug))]);
  } catch (err) {
    logger.warn({ ...errorInfo(err), ...where }, "stock cache invalidation failed");
  }
}

export async function transitionOrder(orderId: string, to: OrderStatus, opts: TransitionOptions = {}) {
  const result = await db.$transaction((tx) => transitionInTx(tx, orderId, to, opts));
  if ((to === "CANCELLED" && HOLDS_STOCK.includes(result.from)) || to === "RETURNED") await invalidateStockCache({ orderId });
  await enqueueSafe("order.status-changed", { orderId, status: to });
  return result;
}

// ─── Payments ───

/** Thrown inside a transaction to roll back a late-payment restore attempt that ran out of stock. */
class LateOutOfStock extends Error {}

const SETTLED_PAYMENT: ("PAID" | "REFUNDED" | "PARTIALLY_REFUNDED")[] = ["PAID", "REFUNDED", "PARTIALLY_REFUNDED"];
const LATE_REFUND_REASON = "Order expired before payment and the item is no longer available";

/**
 * A CANCELLED order whose payment is still PAID is the durable "refund needed" state: it is produced by
 * a late payment with no stock, or by a cancellation whose refund failed. Any repeat delivery of the
 * payment event (and any admin retry) re-attempts the refund until the payment is REFUNDED.
 */
export async function refundIfOwed(orderId: string, reason: string) {
  const owed = await db.payment.findFirst({ where: { orderId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] }, order: { status: "CANCELLED" } } });
  if (!owed) return null;
  return refundOrder(orderId, { reason });
}

/** Idempotently records a captured Razorpay payment (called from the checkout callback and the webhook). */
export async function markRazorpayPaid(input: { razorpayOrderId: string; razorpayPaymentId: string; method?: string | null }) {
  const payment = await db.payment.findUnique({
    where: { providerOrderId: input.razorpayOrderId },
    include: { order: { include: { items: true } } },
  });
  if (!payment) throw new OrderError(`Unknown Razorpay order ${input.razorpayOrderId}`);
  const order = payment.order;

  if (SETTLED_PAYMENT.includes(payment.status as never)) {
    // Already recorded. If the earlier attempt could not refund a cancelled order, try again now.
    await refundIfOwed(order.id, LATE_REFUND_REASON);
    return { orderId: order.id, changed: false };
  }

  const paidData = { status: "PAID" as const, providerPaymentId: input.razorpayPaymentId, method: input.method ?? null, errorReason: null };
  /** Compare-and-set so the checkout callback and the webhook cannot both apply the payment. */
  const claimPayment = async (tx: Tx) =>
    (await tx.payment.updateMany({ where: { id: payment.id, status: { notIn: SETTLED_PAYMENT } }, data: paidData })).count === 1;

  type Outcome = "lost-race" | "confirmed" | "restored" | "refund-needed" | "other";
  let outcome: Outcome;
  try {
    outcome = await db.$transaction(async (tx): Promise<Outcome> => {
      if (!(await claimPayment(tx))) return "lost-race";
      const current = await tx.order.findUnique({ where: { id: order.id }, select: { status: true } });
      if (!current) throw new OrderError("Order not found.");

      if (current.status === "PENDING_PAYMENT") {
        await transitionInTx(tx, order.id, "CONFIRMED", { note: "Payment received", data: { paymentStatus: "PAID", expiresAt: null } });
        return "confirmed";
      }

      if (current.status === "CANCELLED") {
        // Payment arrived after the hold expired: restore only if we win the CANCELLED -> CONFIRMED race,
        // so stock can never be reserved twice for the same order.
        const { count } = await tx.order.updateMany({
          where: { id: order.id, status: "CANCELLED" },
          data: { status: "CONFIRMED", paymentStatus: "PAID", cancelledAt: null, cancelReason: null },
        });
        if (count !== 1) throw new OrderError("The order was updated by someone else — please retry.");
        try {
          await reserveStock(
            tx,
            order.id,
            order.items.filter((i) => i.variantId).map((i) => ({ variantId: i.variantId!, quantity: i.quantity, sku: i.sku, name: i.productName })),
          );
        } catch (err) {
          if (err instanceof OutOfStockError) throw new LateOutOfStock();
          throw err;
        }
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: "CANCELLED", toStatus: "CONFIRMED", note: "Late payment received; order restored" },
        });
        return "restored";
      }

      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
      return "other";
    });
  } catch (err) {
    if (!(err instanceof LateOutOfStock)) throw err;
    // The whole attempt rolled back (including any partial stock reservation). Record the payment on the
    // still-CANCELLED order: payment PAID + order CANCELLED is the durable refund-needed state.
    outcome = await db.$transaction(async (tx): Promise<Outcome> => {
      if (!(await claimPayment(tx))) return "lost-race";
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID" } });
      await tx.orderStatusHistory.create({
        data: { orderId: order.id, fromStatus: "CANCELLED", toStatus: "CANCELLED", note: "Late payment received but stock is gone; refund pending" },
      });
      return "refund-needed";
    });
  }

  if (outcome === "lost-race") return { orderId: order.id, changed: false };

  if (outcome === "restored") await invalidateStockCache({ orderId: order.id });

  if (outcome === "refund-needed") {
    logger.warn({ orderId: order.id }, "late payment for an expired order with no stock; refunding");
    // If this throws, the payment is already durably PAID on a CANCELLED order, so the retried event re-attempts it.
    await refundOrder(order.id, { reason: LATE_REFUND_REASON });
    return { orderId: order.id, changed: true };
  }

  await enqueueSafe("order.placed", { orderId: order.id });
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

type RefundPlan = { refundId: string; paymentId: string; providerPaymentId: string | null; provider: string; amount: number };

/**
 * Reserves a refund against one payment. The payment row is locked (FOR UPDATE) so concurrent callers
 * serialise; the remaining balance is computed under the lock and counts pending refunds, so two
 * callers can never refund the same money twice. Returns null when nothing is left on this payment.
 */
async function reserveRefund(paymentId: string, wanted: number | undefined, opts: { reason: string; actorId?: string | null }): Promise<RefundPlan | null> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { refunds: true } });
    if (!payment || (payment.status !== "PAID" && payment.status !== "PARTIALLY_REFUNDED")) return null;
    const refunded = payment.refunds.filter((r) => r.status !== "failed").reduce((a, r) => a + r.amount, 0);
    const amount = Math.min(wanted ?? Infinity, payment.amount - refunded);
    if (amount <= 0) return null;
    const online = payment.provider === "razorpay" && !!payment.providerPaymentId;
    const refund = await tx.refund.create({
      data: { paymentId, amount, status: online ? "pending" : "manual", reason: opts.reason, actorId: opts.actorId ?? null },
    });
    if (!online) await settleRefund(tx, paymentId); // COD: recorded as a manual refund, finalised immediately
    return { refundId: refund.id, paymentId, providerPaymentId: payment.providerPaymentId, provider: payment.provider, amount };
  });
}

/** Recomputes payment and order refund status from the non-failed refund rows. Runs inside a transaction. */
async function settleRefund(tx: Tx, paymentId: string) {
  const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { refunds: true } });
  if (payment.status === "PENDING" || payment.status === "FAILED") return;
  const refunded = payment.refunds.filter((r) => r.status !== "failed").reduce((a, r) => a + r.amount, 0);
  const status = refunded <= 0 ? "PAID" : refunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED";
  await tx.payment.update({ where: { id: paymentId }, data: { status } });
  const siblings = await tx.payment.findMany({ where: { orderId: payment.orderId }, select: { status: true } });
  const live = siblings.filter((p) => p.status !== "PENDING" && p.status !== "FAILED");
  const orderStatus =
    live.length > 0 && live.every((p) => p.status === "REFUNDED")
      ? "REFUNDED"
      : live.some((p) => p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED")
        ? "PARTIALLY_REFUNDED"
        : "PAID";
  await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: orderStatus } });
}

/**
 * Refunds the online payment(s) for an order (full by default, or `amount` spread across payments).
 * COD refunds are recorded as manual. Safe to call repeatedly: balances are computed under a row lock and
 * Razorpay is called with the refund row id as its idempotency key.
 */
export async function refundOrder(orderId: string, opts: { amount?: number; reason: string; actorId?: string | null }) {
  const payments = await db.payment.findMany({
    where: { orderId, status: { in: ["PAID", "PARTIALLY_REFUNDED"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!payments.length) return null;

  let left = opts.amount;
  let total = 0;
  let status = "manual";
  for (const p of payments) {
    if (left !== undefined && left <= 0) break;
    const plan = await reserveRefund(p.id, left, opts);
    if (!plan) continue;

    if (plan.provider === "razorpay" && plan.providerPaymentId) {
      let providerRefundId: string;
      try {
        const r = await refundPayment(plan.providerPaymentId, plan.amount, opts.reason, plan.refundId);
        providerRefundId = r.id;
        status = r.status;
      } catch (err) {
        logger.error({ ...errorInfo(err), orderId, refundId: plan.refundId }, "razorpay refund failed");
        if (isRetryableRazorpayError(err)) {
          // Timeout / 5xx / network: Razorpay may have accepted the refund. Keep the row pending so the balance stays
          // reserved; the refund.processed / refund.failed webhook (via the idempotency key) settles it.
          throw new OrderError("The refund request timed out; its outcome is being confirmed with Razorpay. Do not retry yet.");
        }
        // Definite rejection (4xx): free the reserved balance so a retry can try again.
        await db.refund.update({ where: { id: plan.refundId }, data: { status: "failed" } });
        throw new OrderError("The refund could not be processed by Razorpay. Please retry from the dashboard.");
      }
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM payments WHERE id = ${plan.paymentId} FOR UPDATE`;
        const current = await tx.refund.findUniqueOrThrow({ where: { id: plan.refundId }, select: { status: true } });
        // A webhook may already have settled this refund; never downgrade a terminal status back to pending.
        const terminal = current.status === "processed" || current.status === "failed";
        await tx.refund.update({ where: { id: plan.refundId }, data: terminal ? { providerRefundId } : { providerRefundId, status } });
        await settleRefund(tx, plan.paymentId);
      });
    }
    total += plan.amount;
    if (left !== undefined) left -= plan.amount;
  }
  if (total <= 0) throw new OrderError("Nothing left to refund.");
  return { amount: total, status };
}

/**
 * Applies a Razorpay refund.processed / refund.failed event. A failed refund frees its balance and
 * rolls the payment/order status back so the refund can be retried. Returns the number of rows matched.
 */
export async function recordRefundOutcome(providerRefundId: string, outcome: "processed" | "failed", refundRowId?: string | null) {
  return db.$transaction(async (tx) => {
    const row =
      (await tx.refund.findUnique({ where: { providerRefundId } })) ??
      (refundRowId ? await tx.refund.findUnique({ where: { id: refundRowId } }) : null);
    if (!row) return 0;
    await tx.$queryRaw`SELECT id FROM payments WHERE id = ${row.paymentId} FOR UPDATE`;
    await tx.refund.update({ where: { id: row.id }, data: { status: outcome, providerRefundId: row.providerRefundId ?? providerRefundId } });
    await settleRefund(tx, row.paymentId);
    return 1;
  });
}

// ─── Customer actions ───

export async function cancelOrderByCustomer(userId: string, orderId: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new OrderError("Order not found.");
  if (order.status !== "CONFIRMED" && order.status !== "PENDING_PAYMENT") {
    throw new OrderError("This order is already being prepared and can no longer be cancelled online. Please contact us.");
  }
  await transitionOrder(orderId, "CANCELLED", { actorId: userId, note: "Cancelled by customer" });
  if (order.paymentStatus === "PAID") {
    try {
      await refundOrder(orderId, { reason: "Cancelled by customer", actorId: userId });
    } catch (err) {
      // The order stays CANCELLED with a PAID payment, which refundIfOwed / the admin refund action can retry.
      logger.error({ ...errorInfo(err), orderId }, "refund after customer cancellation failed; left pending for retry");
    }
  }
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
