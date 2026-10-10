import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { isPlaceholderEmail } from "@/server/auth";
import { db } from "@/server/db";
import { formatINR } from "@/lib/money";
import ProfileForm from "@/components/account/ProfileForm";
import PhoneVerification from "@/components/account/PhoneVerification";
import { statusLabel } from "@/lib/order-status";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const recent = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 });

  return (
    <div className="space-y-8">
      <section className="bg-white p-8 border border-[var(--border)]">
        <h2 className="font-serif !text-2xl text-[var(--navy)] mb-6">Profile</h2>
        <ProfileForm name={user.name} />
        <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Email</dt>
            <dd className="text-[var(--navy)]">
              {isPlaceholderEmail(user.email) ? <span className="text-[var(--text-muted)]">Not added — you&apos;ll be asked at checkout</span> : user.email}
              {!isPlaceholderEmail(user.email) && !user.emailVerified && <span className="ml-2 text-xs text-amber-700">(unverified)</span>}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Mobile</dt>
            <dd className="text-[var(--navy)]">
              {user.phoneNumber ?? "Not added"}
              {user.phoneNumber && user.phoneNumberVerified && <span className="ml-2 text-xs text-emerald-700">✓ verified</span>}
            </dd>
          </div>
        </dl>
      </section>

      {!user.phoneNumberVerified && (
        <section className="bg-white p-8 border border-[var(--border)]">
          <h2 className="font-serif !text-2xl text-[var(--navy)] mb-2">Verify your mobile number</h2>
          <p className="text-sm text-[var(--text-muted)]">Needed for cash on delivery and SMS updates about your orders.</p>
          <PhoneVerification />
        </section>
      )}

      <section className="bg-white p-8 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif !text-2xl text-[var(--navy)]">Recent orders</h2>
          <Link href="/account/orders" className="text-xs uppercase tracking-widest text-[var(--gold-text)] hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No orders yet. <Link href="/shop" className="underline">Explore the collection</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex justify-between py-3 text-sm hover:text-[var(--gold-text)]">
                  <span>
                    <strong>{o.number}</strong> · {o.createdAt.toLocaleDateString("en-IN")}
                  </span>
                  <span>
                    {statusLabel(o.status)} · {formatINR(o.grandTotal)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
