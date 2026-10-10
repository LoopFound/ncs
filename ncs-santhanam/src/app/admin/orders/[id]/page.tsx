import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { ORDER_TRANSITIONS } from "@/server/services/orders";
import { formatINR, formatGstRate } from "@/lib/money";
import { statusLabel, PAYMENT_LABELS } from "@/lib/order-status";
import { PageHeader, Card, Badge, Table, td } from "@/components/admin/ui";
import OrderAdminPanel from "@/components/admin/OrderAdminPanel";

export const metadata = { title: "Order" };

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

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireStaff();
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      items: true,
      shipment: true,
      history: { orderBy: { createdAt: "asc" } },
      payments: { include: { refunds: true } },
    },
  });
  if (!order) notFound();
  const a = order.shippingAddress as unknown as Address;
  const actorIds = [...new Set(order.history.map((h) => h.actorId).filter((x): x is string => Boolean(x)))];
  const actors = await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } });
  const actorName = (aid: string | null) => (aid ? actors.find((x) => x.id === aid)?.name ?? "—" : "System");

  return (
    <>
      <PageHeader
        title={`Order ${order.number}`}
        description={`Placed ${order.placedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`}
        actions={
          <>
            <Badge tone={order.status === "CANCELLED" ? "bad" : order.status === "DELIVERED" ? "good" : "info"}>{statusLabel(order.status)}</Badge>
            <Badge tone={order.paymentStatus === "PAID" ? "good" : order.paymentStatus === "PENDING" ? "warn" : "neutral"}>
              {order.paymentMethod === "COD" ? "COD" : "Online"} · {PAYMENT_LABELS[order.paymentStatus]}
            </Badge>
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Table head={["Item", "HSN / GST", "Qty", "Unit", "Line total"]}>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td className={td}>
                  {i.productId ? (
                    <Link href={`/admin/products/${i.productId}`} className="hover:underline">
                      {i.productName}
                    </Link>
                  ) : (
                    i.productName
                  )}
                  <div className="text-xs text-[var(--text-muted)]">{i.sku}</div>
                </td>
                <td className={td}>
                  {i.hsnCode} · {formatGstRate(i.gstRateBps)}
                </td>
                <td className={td}>{i.quantity}</td>
                <td className={td}>{formatINR(i.unitPrice)}</td>
                <td className={td}>{formatINR(i.lineTotal)}</td>
              </tr>
            ))}
          </Table>

          <Card title="Totals">
            <dl className="grid grid-cols-2 gap-y-1 text-sm max-w-sm">
              <dt>Subtotal</dt>
              <dd className="text-right">{formatINR(order.subtotal)}</dd>
              <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
              <dd className="text-right">−{formatINR(order.discountTotal)}</dd>
              <dt>Shipping</dt>
              <dd className="text-right">{formatINR(order.shippingTotal)}</dd>
              <dt>COD fee</dt>
              <dd className="text-right">{formatINR(order.codFee)}</dd>
              <dt className="font-bold">Grand total</dt>
              <dd className="text-right font-bold">{formatINR(order.grandTotal)}</dd>
              <dt className="text-[var(--text-muted)]">GST included</dt>
              <dd className="text-right text-[var(--text-muted)]">{formatINR(order.taxTotal)}</dd>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="space-y-2 text-sm">
              {order.history.map((h) => (
                <li key={h.id}>
                  <strong>{statusLabel(h.toStatus)}</strong> · {h.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {actorName(h.actorId)}
                  {h.note && <div className="text-xs text-[var(--text-muted)]">{h.note}</div>}
                </li>
              ))}
            </ol>
          </Card>

          <Card title="Payments">
            {order.payments.map((p) => (
              <div key={p.id} className="text-sm mb-3">
                <p className="!mb-0 !text-sm">
                  {p.provider} · {formatINR(p.amount)} · <Badge tone={p.status === "PAID" ? "good" : "neutral"}>{PAYMENT_LABELS[p.status]}</Badge>
                  {p.method && ` · ${p.method}`}
                </p>
                {p.providerPaymentId && <p className="text-xs text-[var(--text-muted)] !mb-0">Razorpay payment {p.providerPaymentId}</p>}
                {p.errorReason && <p className="text-xs text-red-700 !mb-0">{p.errorReason}</p>}
                {p.refunds.map((r) => (
                  <p key={r.id} className="text-xs !mb-0">
                    Refund {formatINR(r.amount)} · {r.status} · {r.reason}
                  </p>
                ))}
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <OrderAdminPanel
            orderId={order.id}
            status={order.status}
            nextStatuses={ORDER_TRANSITIONS[order.status].filter((s) => s !== "SHIPPED" && s !== "REFUNDED")}
            canShip={ORDER_TRANSITIONS[order.status].includes("SHIPPED")}
            canRefund={actor.role === "admin" && (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED")}
            hasInvoice={Boolean(order.invoiceKey)}
            invoiceable={order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED"}
          />

          <Card title="Customer">
            <p className="text-sm !mb-1">
              <Link href={`/admin/customers/${order.user.id}`} className="font-semibold hover:underline">
                {order.user.name}
              </Link>
            </p>
            <p className="text-sm !mb-1">{order.email}</p>
            <p className="text-sm !mb-0">{order.phone}</p>
          </Card>

          <Card title="Ship to">
            <address className="not-italic text-sm">
              {a.fullName}
              <br />
              {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}
              <br />
              {a.city}, {a.state} – {a.pincode}
              <br />
              {a.phone}
            </address>
          </Card>

          <Card title="Finishing">
            <ul className="text-sm space-y-1">
              <li>Fall & pico: {order.addFallPico ? <strong>Yes</strong> : "No"}</li>
              <li>Gift wrap: {order.giftWrap ? <strong>Yes</strong> : "No"}</li>
              {order.giftMessage && <li>Gift message: “{order.giftMessage}”</li>}
              {order.customerNote && <li>Note: {order.customerNote}</li>}
            </ul>
          </Card>

          {order.shipment && (
            <Card title="Shipment">
              <p className="text-sm !mb-1">
                {order.shipment.carrier} · AWB {order.shipment.awb}
              </p>
              {order.shipment.trackingUrl && (
                <a href={order.shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                  Tracking link
                </a>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
