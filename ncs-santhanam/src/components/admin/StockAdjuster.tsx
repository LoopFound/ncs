"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustStockAction } from "@/server/actions/admin/catalog";

/** Adds or removes stock with a reason; every change is written to the inventory ledger. */
export default function StockAdjuster({ variantId, stock, compact = false }: { variantId: string; stock: number; compact?: boolean }) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className={compact ? "flex items-center gap-2" : "flex flex-wrap items-end gap-3"}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await adjustStockAction(variantId, Number(delta), note);
          setMsg(r.ok ? { ok: true, text: `Stock is now ${r.data.stock}` } : { ok: false, text: r.fields?._ ?? r.error });
          if (r.ok) {
            setDelta("");
            setNote("");
            router.refresh();
          }
        });
      }}
    >
      {!compact && <p className="w-full text-sm !mb-0">Current stock: <strong>{stock}</strong></p>}
      <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        {compact ? <span className="sr-only">Change</span> : "Change (+/−)"}
        <input
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          inputMode="numeric"
          pattern="-?\d+"
          required
          placeholder="+5"
          className="mt-1 block w-20 px-2 py-1.5 border border-[var(--border)] text-sm"
        />
      </label>
      {!compact && (
        <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex-1 min-w-40">
          Reason
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="New batch from loom" className="mt-1 block w-full px-2 py-1.5 border border-[var(--border)] text-sm" />
        </label>
      )}
      <button type="submit" disabled={pending} className="px-3 py-1.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest disabled:opacity-50">
        {pending ? "…" : "Apply"}
      </button>
      {msg && <span className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</span>}
    </form>
  );
}
