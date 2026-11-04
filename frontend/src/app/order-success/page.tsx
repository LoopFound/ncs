"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSession } from "@/context/SessionContext";
import { getOrders, type ActionResult, type StorefrontOrder } from "@/lib/api";

const primaryClass =
  "px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors shadow-md";
const secondaryClass =
  "px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors";

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "REFUNDED", "RETURN_REQUESTED", "RETURNED"]);

type Tone = "pending" | "cancelled" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  pending: "bg-amber-100 border-amber-300 text-amber-700",
  cancelled: "bg-[var(--maroon)]/10 border-[var(--maroon)]/30 text-[var(--maroon)]",
  neutral: "bg-[var(--cream)] border-[var(--gold)]/40 text-[var(--gold-text)]",
};

function ToneIcon({ tone }: { tone: Tone }) {
  return (
    <div className={`w-20 h-20 border rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ${TONE_CLASSES[tone]}`}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        {tone === "pending" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </>
        )}
        {tone === "cancelled" && <path d="M18 6 6 18M6 6l12 12" />}
        {tone === "neutral" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </>
        )}
      </svg>
    </div>
  );
}

/** A non-confirmation outcome, laid out like the confirmation page. */
function OrderStatusView({
  tone,
  eyebrow,
  title,
  accent,
  body,
  orderNumber,
  statusLabel,
  actions,
}: {
  tone: Tone;
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  orderNumber: string;
  statusLabel?: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="pt-header pb-24 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <ToneIcon tone={tone} />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
          {eyebrow}
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--navy)] mb-4">
          {title} <br />
          <span className="italic text-[var(--gold-text)]">{accent}</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">{body}</p>
        <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs text-left mb-10 space-y-4">
          <div className={`flex justify-between items-center text-sm ${statusLabel ? "pb-4 border-b border-[var(--border)]" : ""}`}>
            <span className="text-[var(--text-muted)]">Order Reference:</span>
            <span className="font-bold text-[var(--navy)] tracking-wider">{orderNumber}</span>
          </div>
          {statusLabel && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-muted)]">Current Status:</span>
              <span className="font-semibold text-[var(--navy)]">{statusLabel}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">{actions}</div>
      </div>
    </div>
  );
}

function humanize(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Order numbers come from the backend (e.g. NCS-2026-000123); anything else is ignored.
function readOrderNumber(raw: string | null) {
  const value = raw?.trim() ?? "";
  return /^[A-Za-z0-9][A-Za-z0-9-]{2,39}$/.test(value) ? value : null;
}

const NO_REFERENCE =
  "This page was opened without an order reference, so we can't confirm an order here. If you placed an order, it appears in your account with its current status. If a payment was taken and you can't see the order, please contact us before trying again.";
const NOT_IN_ACCOUNT =
  "We couldn't find this order reference in your account, so we can't confirm it here. Your orders and their current status are listed in your account. If a payment was taken and you can't see the order, please contact us before trying again.";

function MissingOrder({ message = NO_REFERENCE }: { message?: string }) {
  return (
    <div className="pt-header pb-24 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
          Order Reference Missing
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--navy)] mb-4">
          We Couldn&apos;t Find <br />
          <span className="italic text-[var(--gold-text)]">Your Order Details</span>
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
          {message}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/account"
            className="px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors shadow-md"
          >
            View My Orders
          </Link>
          <Link
            href="/contact"
            className="px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={null}>
      <OrderSuccessContent />
    </Suspense>
  );
}

function OrderSuccessContent() {
  const orderNumber = readOrderNumber(useSearchParams().get("order"));
  const { status } = useSession();
  const [orders, setOrders] = useState<ActionResult<{ orders: StorefrontOrder[] }> | null>(null);

  useEffect(() => {
    if (status !== "signed-in" || !orderNumber) return;
    let cancelled = false;
    void getOrders().then((result) => {
      if (!cancelled) setOrders(result);
    });
    return () => {
      cancelled = true;
    };
  }, [status, orderNumber]);

  if (!orderNumber) return <MissingOrder />;

  const signInHref = `/login?next=${encodeURIComponent(`/order-success?order=${orderNumber}`)}`;

  // Without a successful lookup we never claim the order is confirmed.
  const neutral = (body: string) => (
    <OrderStatusView
      tone="neutral"
      eyebrow="Order Reference Received"
      title="Thank You for"
      accent="Shopping With Us"
      body={body}
      orderNumber={orderNumber}
      actions={
        <>
          {status === "signed-in" ? (
            <Link href="/account" className={primaryClass}>View My Orders</Link>
          ) : (
            <Link href={signInHref} className={primaryClass}>Sign In to Check Status</Link>
          )}
          <Link href="/contact" className={secondaryClass}>Contact Us</Link>
        </>
      }
    />
  );

  if (status === "loading" || (status === "signed-in" && orders === null)) {
    return (
      <div className="pt-header pb-24 min-h-screen flex items-center justify-center">
        <p role="status" className="text-sm text-[var(--text-muted)]">Checking your order...</p>
      </div>
    );
  }

  if (status !== "signed-in") {
    return neutral("We can't show this order's status here until you sign in. Please check your email for your order confirmation, or sign in to your account to see its latest status.");
  }

  if (!orders?.ok) {
    return neutral("We couldn't load this order's status just now. Please check your email for your order confirmation, or view your account in a moment to see its latest status.");
  }

  const order = orders.data.orders.find((o) => o.number === orderNumber);
  if (!order) return <MissingOrder message={NOT_IN_ACCOUNT} />;

  if (order.status === "PENDING_PAYMENT") {
    return (
      <OrderStatusView
        tone="pending"
        eyebrow="Awaiting Payment Confirmation"
        title="Your Order Is"
        accent="Awaiting Payment"
        body="We haven't received confirmation of your payment for this order yet. If you completed the payment, it is usually confirmed within a few minutes; please don't pay again. You can check its status in your account."
        orderNumber={orderNumber}
        statusLabel={humanize(order.status)}
        actions={
          <>
            <Link href="/account" className={primaryClass}>View My Orders</Link>
            <Link href="/contact" className={secondaryClass}>Contact Us</Link>
          </>
        }
      />
    );
  }

  if (CANCELLED_STATUSES.has(order.status)) {
    const paidOnline = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PENDING" && order.paymentStatus !== "FAILED";
    return (
      <OrderStatusView
        tone="cancelled"
        eyebrow="Order Not Confirmed"
        title="This Order Was"
        accent={humanize(order.status)}
        body={
          paidOnline
            ? "This order is not going ahead. Any payment taken for it is refunded automatically to the original payment method within 5–7 working days. If you have any questions, our atelier is happy to help."
            : "This order is not going ahead. If you have any questions, our atelier is happy to help."
        }
        orderNumber={orderNumber}
        statusLabel={`${humanize(order.status)} · Payment: ${humanize(order.paymentStatus)}`}
        actions={
          <>
            <Link href="/shop" className={primaryClass}>Continue Exploring</Link>
            <Link href="/contact" className={secondaryClass}>Contact Us</Link>
          </>
        }
      />
    );
  }

  if (!CONFIRMED_STATUSES.has(order.status)) {
    return neutral(`This order's current status is "${humanize(order.status)}". You can follow it in your account, and our atelier is happy to help with any questions.`);
  }

  return (
    <div className="pt-header pb-24 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-700 shadow-sm"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.div>

        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
          Order Confirmed & Secured
        </span>

        <h1 className="font-serif text-4xl sm:text-5xl text-[var(--navy)] mb-4">
          Thank You for Welcoming <br />
          <span className="italic text-[var(--gold-text)]">Our Weave</span>
        </h1>

        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
          Your order has been recorded at our Kanchipuram atelier. Our master weavers and preservation team are preparing your silk heirloom for dispatch.
        </p>

        {/* Order Details Card */}
        <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs text-left mb-10 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Order Reference:</span>
            <span className="font-bold text-[var(--navy)] tracking-wider">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Estimated Delivery:</span>
            <span className="font-semibold text-emerald-700">3 – 5 Business Days</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Courier Partner:</span>
            <span className="font-medium text-[var(--navy)]">Blue Dart Express (Air Insured)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Certification Included:</span>
            <span className="font-semibold text-[var(--gold-text)]">Central Silk Board Silk Mark</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shop"
            className="px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors shadow-md"
          >
            Continue Exploring
          </Link>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors"
          >
            Track on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
