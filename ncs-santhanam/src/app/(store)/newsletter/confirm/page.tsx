import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Subscription", robots: { index: false } };

export default async function NewsletterConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string; action?: string }> }) {
  const { token, action } = await searchParams;
  let message = "This link is invalid or has already been used.";

  if (token && /^[A-Za-z0-9_-]{20,64}$/.test(token)) {
    const sub = await db.newsletterSubscriber.findUnique({ where: { token } });
    if (sub) {
      if (action === "unsubscribe") {
        await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "UNSUBSCRIBED" } });
        message = "You've been unsubscribed. We're sorry to see you go.";
      } else {
        await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { status: "CONFIRMED", confirmedAt: sub.confirmedAt ?? new Date() } });
        message = "You're in! Welcome to The Silk Circle.";
      }
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-[70vh] bg-[var(--cream)] flex items-start justify-center px-6">
      <div className="max-w-md text-center bg-white p-10 border border-[var(--border)]">
        <h1 className="font-serif !text-3xl text-[var(--navy)] mb-4">{message}</h1>
        <Link href="/shop" className="inline-block mt-4 px-8 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">
          Explore the collection
        </Link>
      </div>
    </div>
  );
}
