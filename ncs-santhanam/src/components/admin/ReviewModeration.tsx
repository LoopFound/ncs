"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateReviewAction } from "@/server/actions/admin/content";
import { btn } from "./ui";

export default function ReviewModeration({ reviewId, status }: { reviewId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (s: "APPROVED" | "REJECTED") =>
    start(async () => {
      await moderateReviewAction(reviewId, s);
      router.refresh();
    });
  return (
    <div className="flex gap-2 mt-3">
      {status !== "APPROVED" && (
        <button type="button" disabled={pending} onClick={() => set("APPROVED")} className={btn.primary}>
          Approve
        </button>
      )}
      {status !== "REJECTED" && (
        <button type="button" disabled={pending} onClick={() => set("REJECTED")} className={btn.danger}>
          Reject
        </button>
      )}
    </div>
  );
}
