"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, toE164India } from "@/lib/auth-client";

/** Adds/verifies a mobile number on the signed-in account (required for cash on delivery). */
export default function PhoneVerification() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 = toE164India(phone);

  return (
    <form
      className="mt-4 flex flex-col gap-3 max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        if (!e164) return setError("Enter a valid 10-digit Indian mobile number.");
        setBusy(true);
        try {
          if (!sent) {
            const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: e164 });
            if (err) setError(err.status === 429 ? "Please wait a minute before requesting another code." : "We couldn't send a code to that number.");
            else setSent(true);
          } else {
            const { error: err } = await authClient.phoneNumber.verify({ phoneNumber: e164, code, updatePhoneNumber: true });
            if (err) setError(err.message?.toLowerCase().includes("exist") ? "This number is already linked to another account." : "That code is incorrect or has expired.");
            else router.refresh();
          }
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex">
        <span className="px-3 py-3 border border-r-0 border-[var(--border)] bg-[var(--cream)] text-sm">+91</span>
        <input aria-label="Mobile number" type="tel" inputMode="numeric" maxLength={14} disabled={sent} value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-4 py-3 border border-[var(--border)] text-sm" />
      </div>
      {sent && (
        <input
          aria-label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="px-4 py-3 border border-[var(--border)] text-sm tracking-[0.5em] text-center"
          placeholder="••••••"
        />
      )}
      <button type="submit" disabled={busy} className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest disabled:opacity-60">
        {busy ? "Please wait…" : sent ? "Verify" : "Send code"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700 !mb-0">
          {error}
        </p>
      )}
    </form>
  );
}
