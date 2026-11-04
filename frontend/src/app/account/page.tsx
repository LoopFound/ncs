"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/context/SessionContext";
import { getOrders, type ActionResult, type StorefrontOrder } from "@/lib/api";
import { formatINR } from "@/lib/checkout";

const cardClass = "bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs";
const primaryClass =
  "inline-block px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors";
const secondaryClass =
  "inline-block px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors disabled:opacity-60";

function humanize(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AccountPage() {
  const router = useRouter();
  const { status, user, signOut } = useSession();
  const [orders, setOrders] = useState<ActionResult<{ orders: StorefrontOrder[] }> | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "signed-out") router.replace("/login?next=/account");
  }, [status, router]);

  useEffect(() => {
    if (status !== "signed-in") return;
    let cancelled = false;
    void getOrders().then((result) => {
      if (!cancelled) setOrders(result);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    if (await signOut()) {
      router.push("/");
    } else {
      setSignOutError("We couldn't sign you out. Please try again.");
      setIsSigningOut(false);
    }
  };

  if (status === "unavailable") {
    return (
      <div className="pt-header pb-24 min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl border border-[var(--border)] shadow-xs">
          <h1 className="font-serif text-3xl text-[var(--navy)] mb-3">Account Unavailable</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            We couldn&apos;t reach your account just now. Please check your connection and try again.
          </p>
          <button type="button" onClick={() => window.location.reload()} className={primaryClass}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status !== "signed-in" || !user) {
    return (
      <div className="pt-header pb-24 min-h-[70vh] flex items-center justify-center">
        <p role="status" className="text-sm text-[var(--text-muted)]">Loading your account...</p>
      </div>
    );
  }

  const orderList = orders?.ok ? orders.data.orders : [];

  return (
    <div className="pt-header pb-24 min-h-screen">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">My Account</span>
        </div>

        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-1">
            The Silk Circle
          </span>
          <h1 className="font-serif text-4xl text-[var(--navy)]">
            Welcome, {user.name}
          </h1>
        </div>

        <div className="space-y-8">
          <section className={cardClass}>
            <h2 className="font-serif text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
              Account Details
            </h2>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4 pb-4 border-b border-[var(--border)]">
                <dt className="text-[var(--text-muted)]">Name</dt>
                <dd className="font-semibold text-[var(--navy)] text-right">{user.name}</dd>
              </div>
              {user.email && (
                <div className="flex justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <dt className="text-[var(--text-muted)]">Email</dt>
                  <dd className="font-semibold text-[var(--navy)] text-right break-all">
                    {user.email}
                    {!user.emailVerified && <span className="block text-xs font-normal text-[var(--text-muted)]">Not yet verified</span>}
                  </dd>
                </div>
              )}
              {user.phoneNumber && (
                <div className="flex justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <dt className="text-[var(--text-muted)]">Mobile</dt>
                  <dd className="font-semibold text-[var(--navy)] text-right">{user.phoneNumber.replace(/^\+91/, "+91 ")}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="button" onClick={handleSignOut} disabled={isSigningOut} className={secondaryClass}>
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
              {signOutError && <p role="alert" className="text-sm text-[var(--maroon)] mb-0">{signOutError}</p>}
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="font-serif text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
              Your Orders
            </h2>

            {orders === null && <p role="status" className="text-sm text-[var(--text-muted)]">Loading your orders...</p>}

            {orders && !orders.ok && (
              <div role="alert" className="text-sm text-[var(--maroon)]">
                <p className="mb-3">{orders.error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOrders(null);
                    void getOrders().then(setOrders);
                  }}
                  className="text-xs uppercase tracking-widest font-semibold text-[var(--gold-text)] hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {orders?.ok && orderList.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-[var(--text-muted)] mb-6">You haven&apos;t placed an order yet.</p>
                <Link href="/shop" className={primaryClass}>Explore Sarees</Link>
              </div>
            )}

            {orderList.length > 0 && (
              <ul className="divide-y divide-[var(--border)]">
                {orderList.map((order) => (
                  <li key={order.id} className="py-5 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                      <span className="font-bold text-[var(--navy)] tracking-wider text-sm">{order.number}</span>
                      <span className="text-sm font-semibold text-[var(--navy)]">{formatINR(order.grandTotal)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                      {formatDate(order.placedAt)}
                      {formatDate(order.placedAt) && " · "}
                      {order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"}
                    </p>
                    <p className="text-sm text-[var(--text-body)] mb-3">
                      {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase font-semibold text-[var(--gold-text)] bg-white px-2 py-0.5 rounded border border-[var(--gold)]/20">
                        {humanize(order.status)}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-[var(--navy)]/70 bg-white px-2 py-0.5 rounded border border-[var(--border)]">
                        Payment: {humanize(order.paymentStatus)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
