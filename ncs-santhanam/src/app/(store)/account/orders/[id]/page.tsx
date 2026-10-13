import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getOrderForUser, withinReturnWindow } from "@/server/services/orders";
import { formatINR } from "@/lib/money";
import { PAYMENT_LABELS, statusLabel, statusTone } from "@/lib/order-status";
import OrderActions from "@/components/account/OrderActions";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

interface Address {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getOrderForUser(user.id, id);
  if (!order) notFound();

  const a = order.shippingAddress as unknown as Address;
  const canReturn = order.status === "DELIVERED" && !order.addFallPico && withinReturnWindow(order.shipment?.deliveredAt);

  return (
    <div className="space-y-6">
      {sp.placed === "1" && order.status !== "PENDING_PAYMENT" && (
        <div role="status" className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900">
          <p className="font-serif !text-2xl !mb-1">Thank you — your order is confirmed.</p>
          <p className="text-sm !mb-0">A confirmation has been sent to you. We&apos;ll notify you as soon as it ships.</p>
        </div>
      )}
      {(sp.payment === "verifying" || (sp.placed === "1" && order.status === "PENDING_PAYMENT")) && (
        <div role="status" className="p-5 bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          We&apos;re confirming your payment with the bank. This page will show “Confirmed” within a minute — refresh to check.
        </div>
      )}

      <section className="bg-white p-6 sm:p-8 border border-[var(--border)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif !text-3xl text-[var(--navy)] !mb-1">Order {order.number}</h2>
            <p className="text-sm text-[var(--text-muted)] !mb-0">Placed {order.placedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <span className={`text-sm px-4 py-1.5 border rounded-full ${statusTone(order.status)}`}>{statusLabel(order.status)}</span>
        </div>

        <OrderActions
          orderId={order.id}
          canPay={order.status === "PENDING_PAYMENT"}
          canCancel={order.status === "CONFIRMED" || order.status === "PENDING_PAYMENT"}
          canReturn={canReturn}
          hasInvoice={Boolean(order.invoiceKey)}
          expiresAt={order.expiresAt?.toISOString() ?? null}
        />

        {order.shipment && (
          <div className="mt-6 p-4 bg-[var(--cream)] text-sm">
            Shipped via <strong>{order.shipment.carrier}</strong> · AWB <strong>{order.shipment.awb}</strong>
            {order.shipment.trackingUrl && (
              <>
                {" · "}
                <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="underline text-[var(--gold-text)]">
                  Track shipment
                </a>
              </>
            )}
          </div>
        )}
      </section>

      <section className="bg-white p-6 sm:p-8 border border-[var(--border)]">
        <h3 className="font-serif !text-xl text-[var(--navy)] mb-4">Items</h3>
        <ul className="divide-y divide-[var(--border)]">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-4 py-4">
              <div className="w-14 h-18 bg-[var(--greige)] overflow-hidden shrink-0">{i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}</div>
              <div className="flex-1 text-sm">
                <p className="text-[var(--navy)] !mb-0 !text-sm">{i.productName}</p>
                <p className="text-xs text-[var(--text-muted)] !mb-0">
                  {formatINR(i.unitPrice)} × {i.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold">{formatINR(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 pt-4 border-t border-[var(--border)] space-y-2 text-sm max-w-sm ml-auto">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal)}</dd>
          </div>
          {order.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>Discount ({order.couponCode})</dt>
              <dd>−{formatINR(order.discountTotal)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shippingTotal ? formatINR(order.shippingTotal) : "Free"}</dd>
          </div>
          {order.codFee > 0 && (
            <div className="flex justify-between">
              <dt>COD fee</dt>
              <dd>{formatINR(order.codFee)}</dd>
            </div>
          )}
          <div className="flex justify-between font-bold text-[var(--navy)] text-base">
            <dt>Total</dt>
            <dd>{formatINR(order.grandTotal)}</dd>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <dt>Includes GST</dt>
            <dd>{formatINR(order.taxTotal)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white p-6 border border-[var(--border)] text-sm">
          <h3 className="font-serif !text-xl text-[var(--navy)] mb-3">Delivery address</h3>
          <address className="not-italic text-[var(--text-body)]">
            {a.fullName}
            <br />
            {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}
            <br />
            {a.city}, {a.state} – {a.pincode}
            <br />
            {a.phone}
          </address>
        </section>
        <section className="bg-white p-6 border border-[var(--border)] text-sm space-y-1">
          <h3 className="font-serif !text-xl text-[var(--navy)] mb-3">Payment & extras</h3>
          <p className="!text-sm !mb-1">
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Online (Razorpay)"} · {PAYMENT_LABELS[order.paymentStatus]}
          </p>
          {order.addFallPico && <p className="!text-sm !mb-1">Fall & pico finishing requested</p>}
          {order.giftWrap && <p className="!text-sm !mb-1">Gift packaging{order.giftMessage ? `: “${order.giftMessage}”` : ""}</p>}
        </section>
      </div>

      <section className="bg-white p-6 sm:p-8 border border-[var(--border)]">
        <h3 className="font-serif !text-xl text-[var(--navy)] mb-4">Timeline</h3>
        <ol className="border-l border-[var(--gold)] pl-6 space-y-4">
          {order.history.map((h) => (
            <li key={h.id} className="relative text-sm">
              <span className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-[var(--gold)]" />
              <strong className="text-[var(--navy)]">{statusLabel(h.toStatus)}</strong>{" "}
              <span className="text-[var(--text-muted)]">· {h.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              {h.note && <p className="!text-xs text-[var(--text-muted)] !mb-0">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      <Link href="/account/orders" className="inline-block text-xs uppercase tracking-widest text-[var(--gold-text)] hover:underline">
        ← All orders
      </Link>
    </div>
  );
}
