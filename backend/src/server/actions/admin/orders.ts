"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "../../db";
import { audit } from "../../audit";
import { enqueue } from "../../queue";
import { OrderError, refundOrder, transitionInTx, transitionOrder, canTransition } from "../../services/orders";
import type { OrderStatus } from "@/generated/prisma/enums";
import { adminRun, id } from "./shared";

const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"] as const;

export async function updateOrderStatusAction(orderId: string, to: string, note: string) {
  return adminRun("order.status", "staff", async (actor) => {
    const status = z.enum(STATUSES).parse(to) as OrderStatus;
    if (status === "SHIPPED") throw new OrderError("Use “Mark as shipped” so the AWB number is recorded.");
    if (status === "REFUNDED") throw new OrderError("Use “Refund” to send money back to the customer.");
    const oid = id.parse(orderId);
    const order = await db.order.findUniqueOrThrow({ where: { id: oid } });
    await transitionOrder(oid, status, { actorId: actor.id, note: z.string().trim().max(500).parse(note) || `Updated by ${actor.name}` });
    // Cancelling a paid order refunds it automatically.
    if (status === "CANCELLED" && order.paymentStatus === "PAID") {
      await refundOrder(oid, { reason: note || "Order cancelled by store", actorId: actor.id });
    }
    await audit(actor.id, "order.status", "order", oid, { from: order.status, to: status, note });
    revalidatePath(`/admin/orders/${oid}`);
    return undefined;
  });
}

const shipSchema = z.object({
  carrier: z.string().trim().min(2, "Carrier is required").max(60),
  awb: z.string().trim().min(4, "AWB number is required").max(40),
  trackingUrl: z.string().trim().url("Enter a full tracking URL").optional().or(z.literal("")),
});

export async function shipOrderAction(orderId: string, input: z.input<typeof shipSchema>) {
  return adminRun("order.ship", "staff", async (actor) => {
    const oid = id.parse(orderId);
    const s = shipSchema.parse(input);
    const order = await db.order.findUniqueOrThrow({ where: { id: oid } });
    if (!canTransition(order.status, "SHIPPED")) throw new OrderError(`An order that is ${order.status.toLowerCase()} can't be shipped.`);
    await db.$transaction(async (tx) => {
      await tx.shipment.upsert({
        where: { orderId: oid },
        create: { orderId: oid, carrier: s.carrier, awb: s.awb, trackingUrl: s.trackingUrl || null },
        update: { carrier: s.carrier, awb: s.awb, trackingUrl: s.trackingUrl || null, shippedAt: new Date() },
      });
      await transitionInTx(tx, oid, "SHIPPED", { actorId: actor.id, note: `${s.carrier} AWB ${s.awb}` });
    });
    await enqueue("order.status-changed", { orderId: oid, status: "SHIPPED" });
    await audit(actor.id, "order.ship", "order", oid, s);
    revalidatePath(`/admin/orders/${oid}`);
    return undefined;
  });
}

export async function refundOrderAction(orderId: string, amountRupees: string, reason: string) {
  return adminRun("order.refund", "admin", async (actor) => {
    const oid = id.parse(orderId);
    const r = z.string().trim().min(3, "Give a reason").max(250).parse(reason);
    const amount = amountRupees.trim() ? Math.round(z.coerce.number().positive().parse(amountRupees) * 100) : undefined;
    const result = await refundOrder(oid, { amount, reason: r, actorId: actor.id });
    if (!result) throw new OrderError("There is no captured payment to refund on this order.");
    const order = await db.order.findUniqueOrThrow({ where: { id: oid } });
    if (order.status === "RETURNED" && order.paymentStatus === "REFUNDED") {
      await transitionOrder(oid, "REFUNDED", { actorId: actor.id, note: r });
    }
    await audit(actor.id, "order.refund", "order", oid, { amount: result.amount, reason: r });
    revalidatePath(`/admin/orders/${oid}`);
    return result;
  });
}

export async function regenerateInvoiceAction(orderId: string) {
  return adminRun("order.invoice", "staff", async (actor) => {
    const oid = id.parse(orderId);
    await enqueue("invoice.generate", { orderId: oid }, { jobId: `invoice-${oid}-${Date.now()}` });
    await audit(actor.id, "order.invoice", "order", oid);
    return undefined;
  });
}
