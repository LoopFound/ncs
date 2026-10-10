"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/server/actions/account";

export default function ProfileForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col sm:flex-row gap-3 sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfileAction({ name: value });
          setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.fields?.name ?? r.error });
        });
      }}
    >
      <label className="flex-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        Full name
        <input value={value} onChange={(e) => setValue(e.target.value)} required minLength={2} maxLength={80} className="mt-1 w-full px-4 py-3 border border-[var(--border)] text-sm text-[var(--navy)] normal-case tracking-normal" />
      </label>
      <button type="submit" disabled={pending || value === name} className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
      {msg && (
        <span role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>
          {msg.text}
        </span>
      )}
    </form>
  );
}
