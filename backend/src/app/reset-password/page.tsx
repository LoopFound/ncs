"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(params.get("error") ? "This reset link is invalid or has expired." : null);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <p className="text-sm">
        This reset link is invalid or has expired.{" "}
        <Link href="/login" className="underline">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) return setError("The passwords don't match.");
        setBusy(true);
        const { error: err } = await authClient.resetPassword({ newPassword: password, token });
        setBusy(false);
        if (err) return setError("This reset link is invalid or has expired. Please request a new one.");
        router.replace("/login?reset=1");
      }}
    >
      {error && (
        <p role="alert" className="p-3 text-sm bg-red-50 border border-red-200 text-red-800">
          {error}
        </p>
      )}
      <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/70">
        New password
        <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-3 border border-[var(--border)] text-sm" />
      </label>
      <label className="block text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/70">
        Confirm password
        <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full px-4 py-3 border border-[var(--border)] text-sm" />
      </label>
      <button type="submit" disabled={busy} className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] disabled:opacity-60">
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--cream)] pt-36 pb-24 flex items-start justify-center px-6">
      <div className="w-full max-w-md bg-white p-10 border border-[var(--border)] shadow-xl">
        <h1 className="font-serif !text-3xl text-[var(--navy)] mb-6">Choose a new password</h1>
        <Suspense>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
