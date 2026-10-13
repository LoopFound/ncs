"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction, requestReturnAction, resumePaymentAction, verifyPaymentAction } from "@/server/actions/checkout";
import { payWithRazorpay } from "@/components/checkout/razorpay";

interface Props {
  orderId: string;
  canPay: boolean;
  canCancel: boolean;
  canReturn: boolean;
  hasInvoice: boolean;
  expiresAt: string | null;
}

const btn = "px-5 py-2.5 text-xs uppercase tracking-widest transition-colors disabled:opacity-50";

export default function OrderActions({ orderId, canPay, canCancel, canReturn, hasInvoice, expiresAt }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState("");

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      router.refresh();
    });

  if (!canPay && !canCancel && !canReturn && !hasInvoice) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {canPay && (
          <button
            type="button"
            disabled={pending}
            className={`${btn} bg-[var(--navy)] text-white hover:bg-[var(--gold)] hover:text-[var(--navy)]`}
            onClick={() =>
              act(async () => {
                const r = await resumePaymentAction(orderId);
                if (!r.ok) return r;
                const result = await payWithRazorpay({ ...r.data.razorpay!, description: `Order ${r.data.number}` });
                if (!result) return { ok: true };
                return verifyPaymentAction(result);
              })
            }
          >
            Complete payment
          </button>
        )}
        {hasInvoice && (
          <a href={`/api/orders/${orderId}/invoice`} className={`${btn} border border-[var(--navy)] text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white`}>
            Download GST invoice
          </a>
        )}
        {canCancel && (
          <button
            type="button"
            disabled={pending}
            className={`${btn} border border-[var(--maroon)] text-[var(--maroon)] hover:bg-[var(--maroon)] hover:text-white`}
            onClick={() => {
              if (window.confirm("Cancel this order? Any online payment will be refunded to the original method.")) act(() => cancelOrderAction(orderId));
            }}
          >
            Cancel order
          </button>
        )}
        {canReturn && !returning && (
          <button type="button" className={`${btn} border border-[var(--navy)] text-[var(--navy)]`} onClick={() => setReturning(true)}>
            Request a return
          </button>
        )}
      </div>
      {canPay && expiresAt && (
        <p className="text-xs text-amber-800 !mb-0">
          Complete payment by {new Date(expiresAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}, after which the order is released.
        </p>
      )}
      {returning && (
        <form
          className="flex flex-col gap-2 max-w-lg"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => requestReturnAction(orderId, reason));
          }}
        >
          <label className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Why would you like to return it?
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} maxLength={500} required rows={3} className="mt-1 w-full border border-[var(--border)] p-3 text-sm normal-case tracking-normal" />
          </label>
          <button type="submit" disabled={pending} className={`${btn} bg-[var(--navy)] text-white self-start`}>
            Submit return request
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700 !mb-0">
          {error}
        </p>
      )}
    </div>
  );
}
