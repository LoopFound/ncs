"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategoryAction } from "@/server/actions/admin/catalog";
import { deleteBannerAction, deleteShippingRuleAction } from "@/server/actions/admin/content";
import { btn } from "./ui";

const actions = {
  category: deleteCategoryAction,
  banner: deleteBannerAction,
  shippingRule: deleteShippingRuleAction,
} as const;

export default function DeleteButton({ kind, id, label = "Delete" }: { kind: keyof typeof actions; id: string; label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        className={btn.danger}
        onClick={() => {
          if (!window.confirm("Delete permanently?")) return;
          start(async () => {
            const r = await actions[kind](id);
            if (!r.ok) setError(r.error);
            else router.refresh();
          });
        }}
      >
        {label}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
