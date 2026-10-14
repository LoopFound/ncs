"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useCart } from "@/context/CartContext";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { refresh } = useCart();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        await refresh();
        router.replace("/");
        router.refresh();
      }}
      className={className ?? "block w-full text-left px-4 py-2.5 text-sm text-[var(--maroon)] bg-white border border-[var(--border)] hover:border-[var(--maroon)] whitespace-nowrap"}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
