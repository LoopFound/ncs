import type { Job } from "bullmq";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { enqueue, type JobName, type JobPayloads } from "@/server/queue";
import { renderEmail, sendEmail } from "@/server/services/notifications/email";
import { sendSms } from "@/server/services/notifications/sms";
import { expireOrder } from "@/server/services/orders";
import { generateInvoice } from "@/server/services/invoices";
import { isPlaceholderEmail } from "@/server/auth";
import { logger, errorInfo } from "@/server/logger";

type Handler<N extends JobName> = (data: JobPayloads[N], job: Job) => Promise<unknown>;
type Handlers = { [N in JobName]: Handler<N> };

async function orderEmailData(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true, user: { select: { name: true } } },
  });
  if (!order) return null;
  return {
    order,
    data: {
      number: order.number,
      name: order.user.name.split(" ")[0] ?? "",
      url: `${env().APP_URL}/account/orders/${order.id}`,
      grandTotal: order.grandTotal,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ name: i.productName, quantity: i.quantity, lineTotal: i.lineTotal })),
      carrier: order.shipment?.carrier,
      awb: order.shipment?.awb,
      trackingUrl: order.shipment?.trackingUrl ?? null,
      reason: order.cancelReason,
    },
  };
}

/**
 * Automatic enqueues use a fixed job id so duplicates (webhook retries, double events) collapse.
 * An explicit resend carries `resend` (any string/number, e.g. a timestamp) in the job payload,
 * which becomes part of the id so a retained completed/failed job never blocks it.
 */
export function resendSuffix(data: unknown): string {
  const r = (data as { resend?: unknown } | null | undefined)?.resend;
  return typeof r === "string" || typeof r === "number" ? `-r${String(r).replace(/[^A-Za-z0-9_-]/g, "")}` : "";
}

async function notifyOrder(
  orderId: string,
  template: "order-confirmation" | "order-shipped" | "order-delivered" | "order-cancelled",
  sms?: string,
  suffix = "",
) {
  const loaded = await orderEmailData(orderId);
  if (!loaded) return;
  const { order, data } = loaded;
  if (!isPlaceholderEmail(order.email)) {
    await enqueue("email.send", { to: order.email, template, data }, { jobId: `${template}-${orderId}${suffix}` });
  }
  if (sms) {
    await enqueue("sms.send", { to: order.phone, kind: "order", text: sms, vars: { order: order.number } }, { jobId: `sms-${template}-${orderId}${suffix}` });
  }
}

export const handlers: Handlers = {
  "email.send": async ({ to, template, data }) => {
    await sendEmail(to, renderEmail(template, data));
  },

  "sms.send": async ({ to, text, vars }) => {
    await sendSms(to, "order", text, vars);
  },

  "order.placed": async (data) => {
    const { orderId } = data;
    const suffix = resendSuffix(data);
    const order = await db.order.findUnique({ where: { id: orderId }, select: { number: true } });
    if (!order) return;
    await notifyOrder(orderId, "order-confirmation", `Your NCS Santhanam order ${order.number} is confirmed. We'll message you when it ships.`, suffix);
    await enqueue("invoice.generate", { orderId }, { jobId: `invoice-${orderId}${suffix}` });
  },

  "order.status-changed": async (data) => {
    const { orderId, status } = data;
    const suffix = resendSuffix(data);
    const order = await db.order.findUnique({ where: { id: orderId }, include: { shipment: true } });
    if (!order) return;
    if (status === "SHIPPED") {
      await notifyOrder(orderId, "order-shipped", `Order ${order.number} has shipped via ${order.shipment?.carrier ?? "courier"}, AWB ${order.shipment?.awb ?? ""}.`, suffix);
    } else if (status === "DELIVERED") {
      await notifyOrder(orderId, "order-delivered", undefined, suffix);
    } else if (status === "CANCELLED" && (order.paymentMethod === "COD" || order.paymentStatus !== "PENDING")) {
      // Unpaid online orders that simply lapsed aren't announced; completed orders are.
      await notifyOrder(orderId, "order-cancelled", undefined, suffix);
    }
  },

  "order.expire": async ({ orderId }) => {
    const expired = await expireOrder(orderId);
    if (expired) logger.info({ orderId }, "unpaid order expired and stock released");
  },

  "invoice.generate": async ({ orderId }) => {
    const { number } = await generateInvoice(orderId);
    logger.info({ orderId, invoice: number }, "invoice generated");
  },

  "maintenance.cleanup": async () => {
    const now = Date.now();
    // Safety net: expire unpaid orders whose delayed job was lost (e.g. Redis restored from an old snapshot).
    const stale = await db.order.findMany({
      where: { status: "PENDING_PAYMENT", expiresAt: { lt: new Date(now - 10 * 60_000) } },
      select: { id: true },
      take: 500,
    });
    let expiredFailures = 0;
    for (const o of stale) {
      try {
        await expireOrder(o.id);
      } catch (err) {
        expiredFailures++;
        logger.error({ orderId: o.id, ...errorInfo(err) }, "cleanup: could not expire order");
      }
    }

    // Paid orders whose invoice/confirmation job was lost or dead-lettered: re-enqueue (idempotent).
    // The hour bucket in the job id lets a retry through even if an earlier job is retained, while
    // generateInvoice() and the confirmation job id keep the result exactly-once.
    const bucket = Math.floor(now / 3_600_000);
    const uninvoiced = await db.order.findMany({
      where: {
        paymentStatus: "PAID",
        status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] },
        invoiceKey: null,
        placedAt: { lt: new Date(now - 15 * 60_000), gt: new Date(now - 7 * 24 * 3600_000) },
      },
      select: { id: true },
      take: 200,
    });
    let requeued = 0;
    for (const o of uninvoiced) {
      try {
        await enqueue("invoice.generate", { orderId: o.id }, { jobId: `invoice-${o.id}-sweep${bucket}` });
        await enqueue("order.placed", { orderId: o.id }, { jobId: `placed-${o.id}-sweep${Math.floor(bucket / 24)}` });
        requeued++;
      } catch (err) {
        logger.error({ orderId: o.id, ...errorInfo(err) }, "cleanup: could not re-enqueue invoice");
      }
    }

    const carts = await db.cart.deleteMany({ where: { userId: null, updatedAt: { lt: new Date(now - 30 * 24 * 3600_000) } } });
    const verifications = await db.verification.deleteMany({ where: { expiresAt: { lt: new Date(now - 24 * 3600_000) } } });
    const sessions = await db.session.deleteMany({ where: { expiresAt: { lt: new Date(now) } } });
    return { expiredOrders: stale.length - expiredFailures, expireFailures: expiredFailures, invoicesRequeued: requeued, carts: carts.count, verifications: verifications.count, sessions: sessions.count };
  },
};
