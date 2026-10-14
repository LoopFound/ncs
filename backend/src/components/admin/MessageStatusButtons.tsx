"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setContactStatusAction } from "@/server/actions/admin/content";
import { btn } from "./ui";

export default function MessageStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (s: "NEW" | "READ" | "ARCHIVED") =>
    start(async () => {
      await setContactStatusAction(id, s);
      router.refresh();
    });
  return (
    <div className="flex gap-2 mt-3">
      {status !== "READ" && (
        <button type="button" disabled={pending} className={btn.secondary} onClick={() => set("READ")}>
          Mark read
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button type="button" disabled={pending} className={btn.secondary} onClick={() => set("ARCHIVED")}>
          Archive
        </button>
      )}
      {status !== "NEW" && (
        <button type="button" disabled={pending} className={btn.secondary} onClick={() => set("NEW")}>
          Mark unread
        </button>
      )}
    </div>
  );
}
