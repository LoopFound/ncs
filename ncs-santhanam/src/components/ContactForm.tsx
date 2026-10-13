"use client";

import { useState, useTransition } from "react";
import { submitContactAction } from "@/server/actions/engagement";

const field = "w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors aria-[invalid=true]:border-red-500";
const labelCls = "block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2";

export default function ContactForm() {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  if (sent) {
    return (
      <div role="status" className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900">
        <p className="font-serif !text-2xl !mb-1">Thank you for writing to us.</p>
        <p className="text-sm !mb-0">Our concierge will reply within one business day. A copy has been sent to your email.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await submitContactAction(data);
          if (r.ok) setSent(true);
          else {
            setError(r.error);
            setFields(r.fields ?? {});
          }
        });
      }}
    >
      {error && (
        <p role="alert" className="p-3 text-sm bg-red-50 border border-red-200 text-red-800">
          {error}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelCls}>
            Name
          </label>
          <input id="name" name="name" required maxLength={80} autoComplete="name" aria-invalid={Boolean(fields.name)} className={field} />
          {fields.name && <p className="text-xs text-red-700 mt-1">{fields.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" aria-invalid={Boolean(fields.email)} className={field} />
          {fields.email && <p className="text-xs text-red-700 mt-1">{fields.email}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="phone" className={labelCls}>
          Phone (optional)
        </label>
        <input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" className={field} />
      </div>
      <div>
        <label htmlFor="subject" className={labelCls}>
          Subject
        </label>
        <input id="subject" name="subject" required maxLength={150} aria-invalid={Boolean(fields.subject)} className={field} />
        {fields.subject && <p className="text-xs text-red-700 mt-1">{fields.subject}</p>}
      </div>
      <div>
        <label htmlFor="message" className={labelCls}>
          Message
        </label>
        <textarea id="message" name="message" rows={6} required minLength={10} maxLength={4000} aria-invalid={Boolean(fields.message)} className={`${field} resize-none`} />
        {fields.message && <p className="text-xs text-red-700 mt-1">{fields.message}</p>}
      </div>
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="w-full bg-[var(--charcoal)] text-white py-4 text-sm tracking-[0.15em] uppercase hover:bg-black transition-colors disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
