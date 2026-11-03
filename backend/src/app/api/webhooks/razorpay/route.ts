import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { logger, errorInfo } from "@/server/logger";
import { verifyWebhookSignature } from "@/server/services/payments/razorpay";
import { markRazorpayPaid, recordPaymentFailure, recordRefundOutcome } from "@/server/services/orders";

export const dynamic = "force-dynamic";

interface RazorpayWebhook {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; method?: string; error_description?: string | null } };
    refund?: { entity: { id: string; payment_id: string; status: string; notes?: { refundRowId?: string } | unknown[] | null } };
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    logger.warn("razorpay webhook rejected: bad signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let body: RazorpayWebhook;
  try {
    body = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // A missing id would defeat idempotency (a time-based fallback is unique per retry), so refuse it.
  const eventId = request.headers.get("x-razorpay-event-id");
  if (!eventId) {
    logger.warn({ event: body.event }, "razorpay webhook rejected: missing x-razorpay-event-id");
    return NextResponse.json({ error: "missing event id" }, { status: 400 });
  }

  // Idempotency: Razorpay retries deliveries, so each event is processed once.
  const existing = await db.webhookEvent.findUnique({ where: { id: eventId } });
  if (existing?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
  if (!existing) {
    try {
      await db.webhookEvent.create({ data: { id: eventId, provider: "razorpay", type: body.event, payload: JSON.parse(raw) } });
    } catch (err) {
      // P2002 = concurrent delivery of the same event; the unique id makes that safe. Anything else is real.
      if ((err as { code?: string } | null)?.code !== "P2002") {
        logger.error({ ...errorInfo(err), eventId }, "could not record razorpay webhook event");
        return NextResponse.json({ error: "processing failed" }, { status: 500 });
      }
    }
  }

  try {
    const payment = body.payload.payment?.entity;
    switch (body.event) {
      case "payment.captured":
      case "order.paid":
        if (payment) await markRazorpayPaid({ razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id, method: payment.method });
        break;
      case "payment.failed":
        if (payment) await recordPaymentFailure(payment.order_id, payment.error_description ?? "Payment failed");
        break;
      case "refund.processed":
      case "refund.failed": {
        const refund = body.payload.refund?.entity;
        if (refund) {
          const notes = Array.isArray(refund.notes) ? null : (refund.notes as { refundRowId?: string } | null | undefined);
          const count = await recordRefundOutcome(refund.id, body.event === "refund.processed" ? "processed" : "failed", notes?.refundRowId);
          if (count === 0) logger.warn({ eventId, event: body.event, providerRefundId: refund.id }, "razorpay refund webhook matched no refund row");
        }
        break;
      }
      default:
        logger.info({ event: body.event }, "razorpay webhook ignored");
    }
    await db.webhookEvent.update({ where: { id: eventId }, data: { processedAt: new Date(), error: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ ...errorInfo(err), eventId, event: body.event }, "razorpay webhook processing failed");
    await db.webhookEvent
      .update({ where: { id: eventId }, data: { error: err instanceof Error ? err.message.slice(0, 1000) : "error" } })
      .catch(() => undefined);
    // 5xx makes Razorpay retry with backoff.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
