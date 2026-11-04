"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useSession } from "@/context/SessionContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { products } from "@/data/mock";
import {
  placeOrder,
  quoteCheckout,
  syncCart,
  verifyPayment,
  type ActionResult,
  type CartSyncResult,
  type CheckoutQuote,
  type PlacedOrder,
  type RazorpayPaymentResponse,
} from "@/lib/api";
import { readPendingPayment, writePendingPayment, type PendingPayment } from "@/lib/pending-payment";
import {
  INDIAN_STATES,
  buildPlaceOrderInput,
  cartToSyncPayload,
  formatINR,
  isValidPincode,
  mapCheckoutFieldErrors,
  toPaymentMethod,
  validateCheckoutForm,
  type CheckoutForm,
  type UiPaymentMethod,
} from "@/lib/checkout";
import { payWithRazorpay } from "@/lib/razorpay";

type FieldErrors = Partial<Record<keyof CheckoutForm, string>>;

const inputClass =
  "w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1";
const noticeClass = "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900";
const errorClass = "rounded border border-[var(--maroon)]/30 bg-[var(--maroon)]/5 p-3 text-sm text-[var(--maroon)]";
const ctaClass =
  "inline-block px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors";

const PAYMENT_OPTIONS: { id: UiPaymentMethod; label: string; badge: string }[] = [
  { id: "upi", label: "UPI & Instant NetBanking (Google Pay, PhonePe, Paytm, BHIM)", badge: "Instant Confirmation" },
  { id: "card", label: "Credit / Debit Cards (Visa, Mastercard, RuPay, Amex)", badge: "256-Bit Encrypted" },
  { id: "cod", label: "Cash on Delivery (Available across India)", badge: "Verify on Delivery" },
];

const NAME_BY_SLUG = new Map(products.map((p) => [p.slug, p.name]));

function FieldError({ field, errors }: { field: keyof CheckoutForm; errors: FieldErrors }) {
  if (!errors[field]) return null;
  return (
    <p id={`checkout-${field}-error`} className="mt-1 text-xs text-[var(--maroon)]">
      {errors[field]}
    </p>
  );
}

function CenteredCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-header pb-24 min-h-[70vh] flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white rounded-xl border border-[var(--border)] shadow-xs">
        <h2 className="font-serif text-3xl text-[var(--navy)] mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { status, user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formNotes, setFormNotes] = useState<string[]>([]);
  const [cancelledNotice, setCancelledNotice] = useState<string | null>(null);

  // A Razorpay order already created on the server (and, once Razorpay reports success, its payment
  // response). Persisted per user in sessionStorage so retries and reloads reuse this order and
  // re-check this payment instead of placing and paying for a second one.
  const userId = status === "signed-in" ? user?.id ?? null : null;
  const [pendingOverride, setPendingOverride] = useState<{ userId: string; value: PendingPayment | null } | null>(null);
  const pendingPayment = useMemo(() => {
    if (!userId) return null;
    return pendingOverride?.userId === userId ? pendingOverride.value : readPendingPayment(userId);
  }, [userId, pendingOverride]);
  const savePendingPayment = (value: PendingPayment | null) => {
    if (!userId) return;
    writePendingPayment(userId, value);
    setPendingOverride({ userId, value });
  };
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [formData, setFormData] = useState<CheckoutForm>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    addFallPico: true,
    giftWrap: false,
    giftMessage: "",
    paymentMethod: "upi",
  });

  const updateField = <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ---- Server cart sync: the backend is the price and stock authority. ----
  const syncPayload = useMemo(() => cartToSyncPayload(cartItems), [cartItems]);
  const cartKey = `${retryCount}:${JSON.stringify(syncPayload.items)}`;
  const [sync, setSync] = useState<{ key: string; result: ActionResult<CartSyncResult> } | null>(null);

  useEffect(() => {
    if (status !== "signed-in" || syncPayload.items.length === 0) return;
    let cancelled = false;
    void syncCart(syncPayload.items).then((result) => {
      if (!cancelled) setSync({ key: cartKey, result });
    });
    return () => {
      cancelled = true;
    };
  }, [status, syncPayload, cartKey]);

  const currentSync = sync?.key === cartKey ? sync.result : null;
  const syncData = currentSync?.ok ? currentSync.data : null;
  const isSyncing = status === "signed-in" && syncPayload.items.length > 0 && currentSync === null;

  // ---- Live quote: re-runs when the pincode, payment method or coupon changes. ----
  const paymentMethod = toPaymentMethod(formData.paymentMethod);
  const quotePincode = isValidPincode(formData.pincode) ? formData.pincode.trim() : "";
  const quoteKey = syncData ? JSON.stringify([cartKey, quotePincode, appliedCoupon, paymentMethod]) : null;
  const [quote, setQuote] = useState<{ key: string; result: ActionResult<CheckoutQuote> } | null>(null);
  const [lastQuote, setLastQuote] = useState<CheckoutQuote | null>(null);

  useEffect(() => {
    if (!quoteKey) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void quoteCheckout({
        pincode: quotePincode || undefined,
        couponCode: appliedCoupon || undefined,
        paymentMethod,
      }).then((result) => {
        if (cancelled) return;
        setQuote({ key: quoteKey, result });
        if (result.ok) setLastQuote(result.data);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [quoteKey, quotePincode, appliedCoupon, paymentMethod]);

  const currentQuote = quote?.key === quoteKey ? quote.result : null;
  const isQuoting = quoteKey !== null && currentQuote === null;
  const shownQuote = currentQuote?.ok ? currentQuote.data : syncData ? lastQuote : null;
  const quoteError = currentQuote && !currentQuote.ok ? currentQuote.error : null;

  const codDisabledReason =
    shownQuote && !shownQuote.codAllowed ? shownQuote.codReason ?? "Cash on delivery isn't available for this order." : null;
  const onlineDisabledReason =
    shownQuote && !shownQuote.razorpayEnabled ? "Online payment is temporarily unavailable. Please choose cash on delivery." : null;
  const disabledReasonFor = (id: UiPaymentMethod) => (id === "cod" ? codDisabledReason : onlineDisabledReason);
  const selectedMethodBlocked = disabledReasonFor(formData.paymentMethod);

  const lineBySlug = new Map((syncData?.lines ?? []).map((line) => [line.slug, line]));
  const slugById = new Map(products.map((p) => [p.id, p.slug]));
  const missingNames = (syncData?.missing ?? []).map((slug) => NAME_BY_SLUG.get(slug) ?? slug);
  const hasOrderableItems = (syncData?.lines.length ?? 0) > 0;

  // Re-checking a captured payment never depends on prices or stock; it only calls verify.
  const awaitingVerification = Boolean(pendingPayment?.response);
  const canSubmit = awaitingVerification
    ? !isSubmitting
    : !isSubmitting && !isSyncing && !isQuoting && Boolean(shownQuote) && hasOrderableItems && !selectedMethodBlocked;

  const completeOrder = (orderNumber: string) => {
    setIsCompleting(true);
    savePendingPayment(null);
    router.push(`/order-success?order=${encodeURIComponent(orderNumber)}`);
    clearCart();
  };

  const showFailure = (result: { error: string; fields?: Record<string, string> }) => {
    const { byField, other } = mapCheckoutFieldErrors(result.fields);
    setFieldErrors(byField);
    setFormNotes(other);
    setFormError(result.error);
    const first = Object.keys(byField)[0];
    if (first) document.getElementById(`checkout-${first}`)?.focus();
  };

  // Confirms a payment Razorpay reported as successful. Only ever calls verify with the stored
  // response: it never reopens Razorpay or places another order.
  const confirmPayment = async (pending: PendingPayment & { response: RazorpayPaymentResponse }) => {
    const { order, response } = pending;
    const verified = await verifyPayment(response);
    if (!verified.ok) {
      const reason =
        verified.status === 401
          ? "Your session ended, so please sign in again"
          : verified.status === 429
            ? "Too many checks in a short time, so please wait a minute"
            : verified.status === undefined
              ? "We couldn't reach our atelier, so please check your connection"
              : verified.error;
      setFormError(`Your payment for order ${order.number} went through, but we couldn't confirm it yet. ${reason}, then select "Check Payment Status". Please do not pay again.`);
      return;
    }
    if (verified.data.status === "CANCELLED") {
      savePendingPayment(null);
      setCancelledNotice(
        `We're sorry: an item in order ${verified.data.number} sold out while your payment was in progress, so the order has been cancelled. Your payment is being refunded automatically to the original payment method within 5–7 working days. Your bag has been kept.`,
      );
      return;
    }
    if (verified.data.status === "PENDING_PAYMENT") {
      setFormError(`Your payment for order ${order.number} is still being confirmed by the bank. Please wait a moment, then select "Check Payment Status". Please do not pay again.`);
      return;
    }
    completeOrder(verified.data.number || order.number);
  };

  const collectPayment = async (order: PlacedOrder) => {
    if (!order.razorpay) {
      setFormError("We couldn't start the online payment. Please try again or contact us.");
      return;
    }
    const outcome = await payWithRazorpay(order.razorpay, (message) => setFormError(message));
    if (outcome.status === "unavailable") {
      setFormError(`We couldn't load the secure payment window. Please check your connection and select "Complete Payment" to try again. Your order ${order.number} is saved and awaiting payment.`);
      return;
    }
    if (outcome.status === "dismissed") {
      setFormError(`Payment was not completed. Your order ${order.number} is saved and awaiting payment; select "Complete Payment" to continue.`);
      return;
    }
    const captured = { order, response: outcome.response };
    // Persist before verifying, so a failed check or a reload can confirm this same payment.
    savePendingPayment(captured);
    await confirmPayment(captured);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setFormError(null);
    setFormNotes([]);
    setCancelledNotice(null);

    if (pendingPayment) {
      setIsSubmitting(true);
      try {
        if (pendingPayment.response) await confirmPayment({ order: pendingPayment.order, response: pendingPayment.response });
        else await collectPayment(pendingPayment.order);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const clientErrors = validateCheckoutForm(formData);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError("Please check the highlighted fields.");
      document.getElementById(`checkout-${Object.keys(clientErrors)[0]}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await placeOrder(buildPlaceOrderInput(formData, appliedCoupon));
      if (!result.ok) {
        showFailure(result);
        return;
      }
      setFieldErrors({});
      if (result.data.paymentMethod === "COD") {
        completeOrder(result.data.number);
        return;
      }
      if (result.data.razorpay) savePendingPayment({ order: result.data });
      await collectPayment(result.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCoupon = () => setAppliedCoupon(couponInput.trim().toUpperCase());
  const removeCoupon = () => {
    setCouponInput("");
    setAppliedCoupon("");
  };

  if (isCompleting) {
    return (
      <CenteredCard title="Securing Your Order">
        <p role="status" className="text-sm text-[var(--text-muted)]">Taking you to your order confirmation...</p>
      </CenteredCard>
    );
  }

  if (cartItems.length === 0) {
    return (
      <CenteredCard title="Your Bag is Empty">
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Please add your chosen silk sarees to your shopping bag before proceeding to checkout.
        </p>
        <Link href="/shop" className={ctaClass}>
          Explore Sarees
        </Link>
      </CenteredCard>
    );
  }

  if (status === "loading") {
    return (
      <CenteredCard title="Secure Atelier Checkout">
        <p role="status" className="text-sm text-[var(--text-muted)]">Preparing your checkout...</p>
      </CenteredCard>
    );
  }

  if (status === "unavailable") {
    return (
      <CenteredCard title="Checkout Unavailable">
        <p className="text-sm text-[var(--text-muted)] mb-6">
          We couldn&apos;t reach our secure checkout just now. Your bag is saved on this device. Please check your connection and try again.
        </p>
        <button type="button" onClick={() => window.location.reload()} className={ctaClass}>
          Try Again
        </button>
      </CenteredCard>
    );
  }

  if (status === "signed-out") {
    return (
      <CenteredCard title="Sign In to Checkout">
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Your bag is saved on this device. Please sign in or create an account so we can confirm your order, payment and delivery updates.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link href="/login?next=/checkout" className={ctaClass}>
            Sign In to Continue
          </Link>
          <Link href="/cart" className="text-xs uppercase tracking-widest font-semibold text-[var(--gold-text)] hover:underline">
            Return to Bag
          </Link>
        </div>
      </CenteredCard>
    );
  }

  const fieldProps = (field: keyof CheckoutForm) => ({
    id: `checkout-${field}`,
    name: field,
    "aria-invalid": fieldErrors[field] ? true : undefined,
    "aria-describedby": fieldErrors[field] ? `checkout-${field}-error` : undefined,
  });

  const amount = (paise: number | undefined) => (shownQuote && paise !== undefined ? formatINR(paise) : "...");

  const notices: string[] = [];
  if (syncPayload.unknownIds.length > 0) notices.push("Some items in your bag are no longer in our catalogue and won't be included.");
  if (syncPayload.cappedIds.length > 0) notices.push("Up to 10 of each saree can be ordered at once, so we've adjusted the quantity.");
  if (missingNames.length > 0) notices.push(`No longer available and won't be included: ${missingNames.join(", ")}.`);
  for (const warning of syncData?.warnings ?? []) notices.push(warning);

  const submitLabel = isSubmitting
    ? awaitingVerification
      ? "Checking Payment..."
      : "Securing Order..."
    : awaitingVerification
      ? "Check Payment Status"
      : isSyncing || isQuoting
      ? "Confirming Prices..."
      : pendingPayment
        ? "Complete Payment"
        : formData.paymentMethod === "cod"
          ? "Place Order"
          : "Place Order & Pay";

  return (
    <div className="pt-header pb-24 min-h-screen">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
        {/* Breadcrumb */}
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/cart" className="hover:text-[var(--gold)]">Bag</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Express Checkout</span>
        </div>

        <div className="mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-1">
            Secure Atelier Checkout
          </span>
          <h1 className="font-serif text-4xl text-[var(--navy)]">
            Delivery & Payment Information
          </h1>
        </div>

        {(notices.length > 0 || (currentSync && !currentSync.ok)) && (
          <div className="space-y-3 mb-8" role="status">
            {notices.length > 0 && (
              <ul className={`${noticeClass} list-disc pl-8 space-y-1`}>
                {notices.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            )}
            {currentSync && !currentSync.ok && (
              <div className={errorClass}>
                <p className="mb-2">We couldn&apos;t confirm your bag with our atelier: {currentSync.error}</p>
                <button type="button" onClick={() => setRetryCount((n) => n + 1)} className="text-xs uppercase tracking-widest font-semibold underline">
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-12 gap-10">
          {/* Left Form: Details (Span 7) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact & Shipping */}
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
              <h2 className="font-serif text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
                1. Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-fullName" className={labelClass}>
                    Full Name *
                  </label>
                  <input
                    {...fieldProps("fullName")}
                    type="text"
                    required
                    maxLength={80}
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="e.g. Smt. Radhika Ramanathan"
                    className={inputClass}
                  />
                  <FieldError field="fullName" errors={fieldErrors} />
                </div>

                <div>
                  <label htmlFor="checkout-phone" className={labelClass}>
                    Phone Number (for SMS & Courier) *
                  </label>
                  <input
                    {...fieldProps("phone")}
                    type="tel"
                    required
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputClass}
                  />
                  <FieldError field="phone" errors={fieldErrors} />
                </div>

                <div>
                  <label htmlFor="checkout-email" className={labelClass}>
                    Email Address (for Invoice) *
                  </label>
                  <input
                    {...fieldProps("email")}
                    type="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="radhika@example.com"
                    className={inputClass}
                  />
                  <FieldError field="email" errors={fieldErrors} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-address" className={labelClass}>
                    Street Address & House / Flat No. *
                  </label>
                  <input
                    {...fieldProps("address")}
                    type="text"
                    required
                    maxLength={120}
                    autoComplete="street-address"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Door No, Street Name, Apartment/Locality"
                    className={inputClass}
                  />
                  <FieldError field="address" errors={fieldErrors} />
                </div>

                <div>
                  <label htmlFor="checkout-city" className={labelClass}>
                    City *
                  </label>
                  <input
                    {...fieldProps("city")}
                    type="text"
                    required
                    maxLength={60}
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Chennai"
                    className={inputClass}
                  />
                  <FieldError field="city" errors={fieldErrors} />
                </div>

                <div>
                  <label htmlFor="checkout-state" className={labelClass}>
                    State *
                  </label>
                  <select
                    {...fieldProps("state")}
                    required
                    autoComplete="address-level1"
                    value={formData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className={inputClass}
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <FieldError field="state" errors={fieldErrors} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="checkout-pincode" className={labelClass}>
                    PIN Code *
                  </label>
                  <input
                    {...fieldProps("pincode")}
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    value={formData.pincode}
                    onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, ""))}
                    placeholder="600028"
                    className={inputClass}
                  />
                  <FieldError field="pincode" errors={fieldErrors} />
                </div>
              </div>
            </div>

            {/* Bespoke Services */}
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
              <h2 className="font-serif text-2xl text-[var(--navy)] mb-4 pb-2 border-b border-[var(--border)]">
                2. Atelier Saree Customization
              </h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="addFallPico"
                    checked={formData.addFallPico}
                    onChange={(e) => updateField("addFallPico", e.target.checked)}
                    className="mt-1 w-4 h-4 text-[var(--gold)] rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[var(--navy)]">
                      Complimentary Fall & Pico Hemming
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Hand-stitched matching pure cotton fall and edge hemming by our artisans. Adds 2 days to dispatch.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="giftWrap"
                    checked={formData.giftWrap}
                    onChange={(e) => updateField("giftWrap", e.target.checked)}
                    className="mt-1 w-4 h-4 text-[var(--gold)] rounded"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[var(--navy)]">
                      Complimentary Luxury Gift Packaging
                    </span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Enclosed in a royal maroon heritage box with gold zari ribbon and personalized calligraphed card.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
              <h2 className="font-serif text-2xl text-[var(--navy)] mb-4 pb-2 border-b border-[var(--border)]">
                3. Payment Method
              </h2>
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((method) => {
                  const disabledReason = disabledReasonFor(method.id);
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        disabledReason ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      } ${
                        formData.paymentMethod === method.id
                          ? "border-[var(--gold)] bg-[var(--cream)]/60"
                          : "border-[var(--border)] hover:bg-[var(--cream)]/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          disabled={(Boolean(disabledReason) || Boolean(pendingPayment)) && formData.paymentMethod !== method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={() => updateField("paymentMethod", method.id)}
                          className="w-4 h-4 text-[var(--gold)]"
                        />
                        <span className="text-sm font-medium text-[var(--navy)]">
                          {method.label}
                          {disabledReason && (
                            <span className="block text-xs font-normal text-[var(--text-muted)] mt-0.5">{disabledReason}</span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-[var(--gold-text)] bg-white px-2 py-0.5 rounded border border-[var(--gold)]/20">
                        {method.badge}
                      </span>
                    </label>
                  );
                })}
              </div>
              <FieldError field="paymentMethod" errors={fieldErrors} />
            </div>
          </div>

          {/* Right Summary (Span 5) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-sm sticky top-36">
              <h3 className="font-serif text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2">
                {cartItems.map((item) => {
                  const slug = slugById.get(item.id);
                  const line = slug ? lineBySlug.get(slug) : undefined;
                  const unavailable = Boolean(syncData) && !line;
                  return (
                    <div key={item.id} className={`flex gap-4 items-center ${unavailable ? "opacity-50" : ""}`}>
                      <div className="w-16 h-20 bg-[var(--greige)] rounded overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-sm text-[var(--navy)] font-medium leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Qty: {line?.quantity ?? item.quantity}</p>
                        <p className="text-xs font-semibold text-[var(--navy)] mt-1">
                          {unavailable
                            ? "Unavailable"
                            : line
                              ? formatINR(line.lineTotal)
                              : `₹${(item.price * item.quantity).toLocaleString("en-IN")}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon */}
              <div className="mb-4 text-sm">
                <label htmlFor="checkout-coupon" className={labelClass}>
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="checkout-coupon"
                    name="couponCode"
                    type="text"
                    maxLength={32}
                    autoComplete="off"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyCoupon();
                      }
                    }}
                    className={`${inputClass} uppercase`}
                  />
                  {appliedCoupon && appliedCoupon === couponInput.trim().toUpperCase() ? (
                    <button type="button" onClick={removeCoupon} className="px-4 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold rounded hover:bg-[var(--navy)] hover:text-white transition-colors">
                      Remove
                    </button>
                  ) : (
                    <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()} className="px-4 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold rounded hover:bg-[var(--navy)] hover:text-white transition-colors disabled:opacity-50">
                      Apply
                    </button>
                  )}
                </div>
                {appliedCoupon && shownQuote?.couponError && (
                  <p className="mt-1 text-xs text-[var(--maroon)]">{shownQuote.couponError}</p>
                )}
                {appliedCoupon && shownQuote?.couponCode && (
                  <p className="mt-1 text-xs text-emerald-700">Coupon {shownQuote.couponCode} applied.</p>
                )}
              </div>

              {/* Calculation */}
              <div className="space-y-3 text-sm border-t border-[var(--border)] pt-4 mb-6" aria-busy={isQuoting || isSyncing}>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Subtotal</span>
                  <span>{amount(shownQuote?.totals.subtotal)}</span>
                </div>
                {shownQuote && shownQuote.totals.discountTotal > 0 && (
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Coupon Discount</span>
                    <span>−{formatINR(shownQuote.totals.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Goods & Services Tax (GST, included)</span>
                  <span>{amount(shownQuote?.totals.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Insured Express Shipping</span>
                  {shownQuote && shownQuote.totals.shippingTotal === 0 ? (
                    <span className="text-emerald-700 font-semibold uppercase text-xs">Complimentary</span>
                  ) : (
                    <span>{amount(shownQuote?.totals.shippingTotal)}</span>
                  )}
                </div>
                {shownQuote && shownQuote.totals.codFee > 0 && (
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>Cash on Delivery Fee</span>
                    <span>{formatINR(shownQuote.totals.codFee)}</span>
                  </div>
                )}
                <div className="h-px bg-[var(--border)] my-2" />
                <div className="flex justify-between text-lg font-bold text-[var(--navy)]">
                  <span>Grand Total</span>
                  <span>{amount(shownQuote?.totals.grandTotal)}</span>
                </div>
                {!quotePincode && (
                  <p className="text-xs text-[var(--text-muted)]">Enter your PIN code to confirm delivery charges and cash on delivery.</p>
                )}
                {shownQuote?.shipping && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Estimated delivery: {shownQuote.shipping.etaMinDays} – {shownQuote.shipping.etaMaxDays} business days after dispatch.
                  </p>
                )}
                {quoteError && (
                  <div className={errorClass}>
                    <p className="mb-2">We couldn&apos;t confirm your total: {quoteError}</p>
                    <button type="button" onClick={() => setRetryCount((n) => n + 1)} className="text-xs uppercase tracking-widest font-semibold underline">
                      Try again
                    </button>
                  </div>
                )}
              </div>

              {pendingPayment && !formError && (
                <p role="status" className={`${noticeClass} mb-4`}>
                  {pendingPayment.response
                    ? `We received your payment for order ${pendingPayment.order.number} and are confirming it. Select "Check Payment Status"; please do not pay again.`
                    : `Order ${pendingPayment.order.number} is saved with these details and is awaiting online payment.`}
                </p>
              )}

              {cancelledNotice && (
                <p role="alert" className={`${noticeClass} mb-4`}>
                  {cancelledNotice}
                </p>
              )}

              {(formError || formNotes.length > 0 || (selectedMethodBlocked && !awaitingVerification)) && (
                <div role="alert" className={`${errorClass} mb-4 space-y-1`}>
                  {formError && <p className="mb-0">{formError}</p>}
                  {formNotes.map((note) => (
                    <p key={note} className="mb-0">{note}</p>
                  ))}
                  {selectedMethodBlocked && !awaitingVerification && <p className="mb-0">{selectedMethodBlocked} Please choose another payment method.</p>}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 disabled:opacity-70 rounded shadow-md"
              >
                {submitLabel}
              </button>

              <div className="mt-6 text-[10px] text-center text-[var(--text-muted)] space-y-1">
                <p>🔒 256-Bit Encrypted Secure Checkout</p>
                <p>🏅 Includes Central Silk Board Certified Silk Mark</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
