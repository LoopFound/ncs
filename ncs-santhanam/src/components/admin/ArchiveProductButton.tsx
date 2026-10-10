"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProductAction } from "@/server/actions/admin/catalog";
import { btn } from "./ui";

export default function ArchiveProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={btn.danger}
      onClick={() => {
        if (!window.confirm("Archive this product? It disappears from the store but past orders keep their records.")) return;
        start(async () => {
          await archiveProductAction(productId);
          router.push("/admin/products");
        });
      }}
    >
      Archive
    </button>
  );
}
