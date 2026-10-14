"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundOrderAction, regenerateInvoiceAction, shipOrderAction, updateOrderStatusAction } from "@/server/actions/admin/orders";
import { statusLabel } from "@/lib/order-status";
import { btn } from "./ui";

interface Props {
  orderId: string;
  status: string;
  nextStatuses: string[];
  canShip: boolean;
  canRefund: boolean;
  hasInvoice: boolean;
  invoiceable: boolean;
}

const input = "mt-1 w-full px-3 py-2 border border-[var(--border)] text-sm";
const label = "block text-[10px] uppercase tracking-widest text-[var(--text-muted)]";

export default function OrderAdminPanel({ orderId, nextStatuses, canShip, canRefund, hasInvoice, invoiceable }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState("");
  const [ship, setShip] = useState({ carrier: "Blue Dart", awb: "", trackingUrl: "" });
  const [refund, setRefund] = useState({ amount: "", reason: "" });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const r = await fn();
      setMessage(r.ok ? { ok: true, text: success } : { ok: false, text: r.error ?? "Failed" });
      if (r.ok) router.refresh();
    });

  return (
    <section className="bg-white border border-[var(--gold)] p-6 space-y-6">
      <h2 className="font-serif !text-xl text-[var(--navy)] !mb-0">Actions</h2>

      {canShip && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => shipOrderAction(orderId, ship), "Marked as shipped — the customer has been notified.");
          }}
        >
          <p className="text-sm font-semibold text-[var(--navy)] !mb-0">Mark as shipped</p>
          <label className={label}>
            Carrier
            <input required value={ship.carrier} onChange={(e) => setShip({ ...ship, carrier: e.target.value })} className={input} />
          </label>
          <label className={label}>
            AWB number
            <input required value={ship.awb} onChange={(e) => setShip({ ...ship, awb: e.target.value })} className={input} />
          </label>
          <label className={label}>
            Tracking URL (optional)
            <input type="url" value={ship.trackingUrl} onChange={(e) => setShip({ ...ship, trackingUrl: e.target.value })} className={input} />
          </label>
          <button type="submit" disabled={pending} className={btn.primary}>
            Mark shipped
          </button>
        </form>
      )}

      {nextStatuses.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--navy)] !mb-0">Change status</p>
          <label className={label}>
            Note (shown in the order timeline)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className={input} />
          </label>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending}
                className={s === "CANCELLED" ? btn.danger : btn.secondary}
                onClick={() => {
                  if (s === "CANCELLED" && !window.confirm("Cancel this order? Paid orders are refunded automatically and stock is restored.")) return;
                  run(() => updateOrderStatusAction(orderId, s, note), `Order moved to ${statusLabel(s)}.`);
                }}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      )}

      {canRefund && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!window.confirm("Send this refund to the customer's original payment method?")) return;
            run(() => refundOrderAction(orderId, refund.amount, refund.reason), "Refund initiated.");
          }}
        >
          <p className="text-sm font-semibold text-[var(--navy)] !mb-0">Refund</p>
          <label className={label}>
            Amount in ₹ (blank = full remaining)
            <input inputMode="decimal" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} className={input} />
          </label>
          <label className={label}>
            Reason
            <input required value={refund.reason} onChange={(e) => setRefund({ ...refund, reason: e.target.value })} className={input} />
          </label>
          <button type="submit" disabled={pending} className={btn.danger}>
            Issue refund
          </button>
        </form>
      )}

      {invoiceable && (
        <div className="flex flex-wrap gap-2">
          {hasInvoice && (
            <a href={`/api/orders/${orderId}/invoice`} className={btn.secondary}>
              Download invoice
            </a>
          )}
          {!hasInvoice && (
            <button type="button" disabled={pending} className={btn.secondary} onClick={() => run(() => regenerateInvoiceAction(orderId), "Invoice generation queued — refresh in a few seconds.")}>
              Generate invoice
            </button>
          )}
        </div>
      )}

      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-sm !mb-0 ${message.ok ? "text-emerald-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
