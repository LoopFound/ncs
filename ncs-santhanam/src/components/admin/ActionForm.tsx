"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; fields?: Record<string, string> };

interface Props {
  action: (fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel?: string;
  /** Where to go after success; receives the action's data. Defaults to refreshing the page. */
  redirectTo?: (data: unknown) => string | null;
  successMessage?: string;
  className?: string;
  resetOnSuccess?: boolean;
}

/** Submits a plain form to an admin server action and shows validation errors. */
export default function ActionForm({ action, children, submitLabel = "Save", redirectTo, successMessage = "Saved.", className = "", resetOnSuccess }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string; fields?: Record<string, string> } | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        start(async () => {
          const r = await action(fd);
          if (!r.ok) {
            setStatus({ ok: false, message: r.error, fields: r.fields });
            return;
          }
          setStatus({ ok: true, message: successMessage });
          if (resetOnSuccess) form.reset();
          const to = redirectTo?.(r.data);
          if (to) router.push(to);
          else router.refresh();
        });
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-4 mt-6">
        <button type="submit" disabled={pending} className="px-6 py-2.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--navy)] disabled:opacity-50">
          {pending ? "Saving…" : submitLabel}
        </button>
        {status && (
          <div role={status.ok ? "status" : "alert"} className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
            {status.message}
            {status.fields && (
              <ul className="list-disc pl-5 text-xs mt-1">
                {Object.entries(status.fields).map(([k, v]) => (
                  <li key={k}>
                    <strong>{k}</strong>: {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
