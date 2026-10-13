import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { logger, errorInfo } from "@/server/logger";
import { verifyWebhookSignature } from "@/server/services/payments/razorpay";
import { markRazorpayPaid, recordPaymentFailure } from "@/server/services/orders";

export const dynamic = "force-dynamic";

interface RazorpayWebhook {
  event: string;
  payload: {
    payment?: { entity: { id: string; order_id: string; method?: string; error_description?: string | null } };
    refund?: { entity: { id: string; payment_id: string; status: string } };
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

  const eventId = request.headers.get("x-razorpay-event-id") ?? `${body.event}:${body.payload.payment?.entity.id ?? body.payload.refund?.entity.id ?? Date.now()}`;

  // Idempotency: Razorpay retries deliveries, so each event is processed once.
  const existing = await db.webhookEvent.findUnique({ where: { id: eventId } });
  if (existing?.processedAt) return NextResponse.json({ ok: true, duplicate: true });
  if (!existing) {
    await db.webhookEvent
      .create({ data: { id: eventId, provider: "razorpay", type: body.event, payload: JSON.parse(raw) } })
      .catch(() => undefined); // concurrent delivery — the unique id makes this safe
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
          await db.refund.updateMany({
            where: { providerRefundId: refund.id },
            data: { status: body.event === "refund.processed" ? "processed" : "failed" },
          });
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
