"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserBannedAction, setUserRoleAction } from "@/server/actions/admin/content";
import { btn } from "./ui";

export default function CustomerAdminControls({ userId, role, banned }: { userId: string; role: "user" | "staff" | "admin"; banned: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [nextRole, setNextRole] = useState(role);
  const [reason, setReason] = useState("");

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? ok : r.error ?? "Failed");
      router.refresh();
    });

  return (
    <section className="bg-white border border-[var(--gold)] p-6 space-y-4">
      <h2 className="font-serif !text-xl text-[var(--navy)] !mb-0">Access</h2>
      <div className="flex items-end gap-2">
        <label className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] flex-1">
          Role
          <select value={nextRole} onChange={(e) => setNextRole(e.target.value as typeof role)} className="mt-1 block w-full px-3 py-2 border border-[var(--border)] text-sm">
            <option value="user">Customer</option>
            <option value="staff">Staff (orders, catalog, content)</option>
            <option value="admin">Admin (everything)</option>
          </select>
        </label>
        <button type="button" disabled={pending || nextRole === role} className={btn.secondary} onClick={() => act(() => setUserRoleAction(userId, nextRole), "Role updated; their sessions were signed out.")}>
          Save
        </button>
      </div>
      {banned ? (
        <button type="button" disabled={pending} className={btn.secondary} onClick={() => act(() => setUserBannedAction(userId, false, ""), "Account restored.")}>
          Lift ban
        </button>
      ) : (
        <div className="space-y-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for ban" className="w-full px-3 py-2 border border-[var(--border)] text-sm" />
          <button
            type="button"
            disabled={pending}
            className={btn.danger}
            onClick={() => window.confirm("Ban this account and sign them out everywhere?") && act(() => setUserBannedAction(userId, true, reason), "Account banned.")}
          >
            Ban account
          </button>
        </div>
      )}
      {msg && <p className="text-sm !mb-0">{msg}</p>}
    </section>
  );
}
