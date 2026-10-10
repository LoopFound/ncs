"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/money";
import { placeOrderAction, quoteCheckoutAction, verifyPaymentAction } from "@/server/actions/checkout";
import type { CheckoutQuote } from "@/server/services/checkout";
import { useCart } from "@/context/CartContext";
import AddressFields, { emptyAddress, type AddressValues } from "./AddressFields";
import { payWithRazorpay } from "./razorpay";

interface SavedAddress extends Omit<AddressValues, "line2" | "landmark"> {
  id: string;
  line2: string | null;
  landmark: string | null;
}

interface Props {
  initialQuote: CheckoutQuote;
  addresses: SavedAddress[];
  needsEmail: boolean;
  defaultName: string;
  defaultPhone: string;
}

const card = "bg-white p-6 sm:p-8 rounded-xl border border-[var(--border)]";
const h2 = "font-serif !text-2xl text-[var(--navy)] mb-5 pb-2 border-b border-[var(--border)]";

export default function CheckoutForm({ initialQuote, addresses, needsEmail, defaultName, defaultPhone }: Props) {
  const router = useRouter();
  const { refresh } = useCart();
  const [quote, setQuote] = useState(initialQuote);
  const [addressId, setAddressId] = useState<string | "new">(addresses[0]?.id ?? "new");
  const [address, setAddress] = useState<AddressValues>(emptyAddress(defaultName, defaultPhone));
  const [saveAddress, setSaveAddress] = useState(true);
  const [email, setEmail] = useState("");
  const [chosenMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">(initialQuote.razorpayEnabled ? "RAZORPAY" : "COD");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string>("");
  const [addFallPico, setAddFallPico] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isQuoting, startQuote] = useTransition();
  const [isPlacing, setIsPlacing] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Fall back to online payment if COD becomes unavailable for this address/total.
  const paymentMethod = chosenMethod === "COD" && !quote.codAllowed && quote.razorpayEnabled ? "RAZORPAY" : chosenMethod;

  const pincode = addressId === "new" ? address.pincode : addresses.find((a) => a.id === addressId)?.pincode ?? "";

  // Re-price whenever the PIN code, coupon or payment method changes.
  useEffect(() => {
    if (pincode && !/^[1-9]\d{5}$/.test(pincode)) return;
    startQuote(async () => {
      const r = await quoteCheckoutAction({ pincode, couponCode: appliedCoupon, paymentMethod });
      if (r.ok) setQuote(r.data);
    });
  }, [pincode, appliedCoupon, paymentMethod]);


  const fail = (message: string, fields?: Record<string, string>) => {
    setFormError(message);
    setErrors(fields ?? {});
    requestAnimationFrame(() => errorRef.current?.focus());
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlacing) return;
    setIsPlacing(true);
    setFormError(null);
    setErrors({});
    try {
      const placed = await placeOrderAction({
        ...(addressId === "new" ? { address } : { addressId }),
        saveAddress: addressId === "new" && saveAddress,
        email: needsEmail ? email : "",
        paymentMethod,
        couponCode: appliedCoupon,
        addFallPico,
        giftWrap,
        giftMessage,
        customerNote: note,
      });
      if (!placed.ok) {
        fail(placed.error, placed.fields);
        return;
      }
      await refresh();
      const order = placed.data;
      if (order.paymentMethod === "COD" || !order.razorpay) {
        router.push(`/account/orders/${order.orderId}?placed=1`);
        return;
      }
      const result = await payWithRazorpay({ ...order.razorpay, description: `Order ${order.number}` });
      if (!result) {
        router.push(`/account/orders/${order.orderId}?payment=pending`);
        return;
      }
      const verified = await verifyPaymentAction(result);
      router.push(`/account/orders/${order.orderId}?${verified.ok ? "placed=1" : "payment=verifying"}`);
    } catch {
      fail("We couldn't reach our servers. Please check your connection — your bag is safe.");
    } finally {
      setIsPlacing(false);
    }
  };

  const t = quote.totals;

  return (
    <form onSubmit={submit} noValidate className="grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7 space-y-8">
        {formError && (
          <div ref={errorRef} tabIndex={-1} role="alert" className="p-4 border border-red-300 bg-red-50 text-red-800 text-sm">
            {formError}
          </div>
        )}

        <section className={card} aria-labelledby="addr-h">
          <h2 id="addr-h" className={h2}>
            1. Delivery address
          </h2>
          {addresses.length > 0 && (
            <fieldset className="space-y-3 mb-6">
              <legend className="sr-only">Saved addresses</legend>
              {addresses.map((a) => (
                <label key={a.id} className={`flex gap-3 p-4 border rounded-lg cursor-pointer ${addressId === a.id ? "border-[var(--gold)] bg-[var(--cream)]/60" : "border-[var(--border)]"}`}>
                  <input type="radio" name="addressId" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[var(--navy)]" />
                  <span className="text-sm text-[var(--navy)]">
                    <strong>{a.fullName}</strong> · {a.phone}
                    <br />
                    {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}, {a.city}, {a.state} – {a.pincode}
                  </span>
                </label>
              ))}
              <label className={`flex gap-3 p-4 border rounded-lg cursor-pointer ${addressId === "new" ? "border-[var(--gold)] bg-[var(--cream)]/60" : "border-[var(--border)]"}`}>
                <input type="radio" name="addressId" checked={addressId === "new"} onChange={() => setAddressId("new")} className="accent-[var(--navy)]" />
                <span className="text-sm text-[var(--navy)] font-medium">Deliver to a new address</span>
              </label>
            </fieldset>
          )}
          {addressId === "new" && (
            <>
              <AddressFields values={address} onChange={setAddress} errors={errors} prefix="address." />
              <label className="flex items-center gap-2 mt-4 text-sm text-[var(--navy)]">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[var(--navy)]" />
                Save this address to my account
              </label>
            </>
          )}
          {errors.addressId && <p className="text-xs text-red-700 mt-2">{errors.addressId}</p>}
          {pincode && !quote.shipping && !isQuoting && <p className="text-sm text-red-700 mt-3">Sorry, we don&apos;t deliver to PIN code {pincode} yet.</p>}
          {quote.shipping && (
            <p className="text-xs text-emerald-800 mt-3 !mb-0">
              Estimated delivery in {quote.shipping.etaMinDays}–{quote.shipping.etaMaxDays} business days after dispatch.
            </p>
          )}
          {needsEmail && (
            <div className="mt-6">
              <label htmlFor="checkout-email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                Email for your invoice *
              </label>
              <input
                id="checkout-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
              />
              {errors.email && <p className="text-xs text-red-700 mt-1">{errors.email}</p>}
            </div>
          )}
        </section>

        <section className={card} aria-labelledby="custom-h">
          <h2 id="custom-h" className={h2}>
            2. Saree finishing & gifting
          </h2>
          <div className="space-y-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={addFallPico} onChange={(e) => setAddFallPico(e.target.checked)} className="mt-1 w-4 h-4 accent-[var(--navy)]" />
              <span>
                <span className="text-sm font-semibold text-[var(--navy)]">Complimentary fall & pico</span>
                <span className="block text-xs text-[var(--text-muted)]">
                  Hand-stitched matching cotton fall and edge hemming. Adds 3–5 business days before dispatch.{" "}
                  <strong className="text-[var(--maroon)]">Customised sarees can&apos;t be returned or exchanged.</strong>
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} className="mt-1 w-4 h-4 accent-[var(--navy)]" />
              <span>
                <span className="text-sm font-semibold text-[var(--navy)]">Complimentary gift packaging</span>
                <span className="block text-xs text-[var(--text-muted)]">Heritage box with zari ribbon and a handwritten card.</span>
              </span>
            </label>
            {giftWrap && (
              <textarea
                aria-label="Gift message"
                placeholder="Gift message (optional)"
                maxLength={300}
                rows={2}
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded text-sm"
              />
            )}
            <textarea
              aria-label="Order notes"
              placeholder="Notes for our team (optional)"
              maxLength={500}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded text-sm"
            />
          </div>
        </section>

        <section className={card} aria-labelledby="pay-h">
          <h2 id="pay-h" className={h2}>
            3. Payment
          </h2>
          <fieldset className="space-y-3">
            <legend className="sr-only">Payment method</legend>
            <label className={`flex items-center gap-3 p-4 rounded-lg border ${!quote.razorpayEnabled ? "opacity-50" : "cursor-pointer"} ${paymentMethod === "RAZORPAY" ? "border-[var(--gold)] bg-[var(--cream)]/60" : "border-[var(--border)]"}`}>
              <input type="radio" name="payment" disabled={!quote.razorpayEnabled} checked={paymentMethod === "RAZORPAY"} onChange={() => setPaymentMethod("RAZORPAY")} className="accent-[var(--navy)]" />
              <span className="text-sm text-[var(--navy)]">
                <strong>Pay online</strong> — UPI, cards, net banking & wallets via Razorpay
                {!quote.razorpayEnabled && <span className="block text-xs">Temporarily unavailable</span>}
              </span>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded-lg border ${!quote.codAllowed ? "opacity-60" : "cursor-pointer"} ${paymentMethod === "COD" ? "border-[var(--gold)] bg-[var(--cream)]/60" : "border-[var(--border)]"}`}>
              <input type="radio" name="payment" disabled={!quote.codAllowed} checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} className="accent-[var(--navy)]" />
              <span className="text-sm text-[var(--navy)]">
                <strong>Cash on delivery</strong>
                {quote.codReason && <span className="block text-xs text-[var(--text-muted)]">{quote.codReason}</span>}
              </span>
            </label>
          </fieldset>
          {errors.paymentMethod && <p className="text-xs text-red-700 mt-2">{errors.paymentMethod}</p>}
        </section>
      </div>

      <aside className="lg:col-span-5">
        <div className={`${card} lg:sticky lg:top-32`} aria-busy={isQuoting}>
          <h2 className="font-serif !text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">Order summary</h2>
          <ul className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2">
            {quote.lines.map((l) => (
              <li key={l.variantId} className="flex gap-4 items-center">
                <div className="w-14 h-18 bg-[var(--greige)] rounded overflow-hidden shrink-0">{l.image && <img src={l.image} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 text-sm">
                  <p className="text-[var(--navy)] !mb-0 !text-sm">{l.name}</p>
                  <p className="text-xs text-[var(--text-muted)] !mb-0">Qty {l.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--navy)]">{formatINR(l.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2 mb-2">
            <label htmlFor="coupon" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              maxLength={32}
              className="flex-1 px-3 py-2 border border-[var(--border)] text-sm uppercase"
            />
            {appliedCoupon ? (
              <button type="button" onClick={() => { setAppliedCoupon(""); setCouponInput(""); }} className="px-4 py-2 text-xs uppercase tracking-widest border border-[var(--navy)] text-[var(--navy)]">
                Remove
              </button>
            ) : (
              <button type="button" onClick={() => setAppliedCoupon(couponInput.trim())} disabled={!couponInput.trim()} className="px-4 py-2 text-xs uppercase tracking-widest bg-[var(--navy)] text-white disabled:opacity-50">
                Apply
              </button>
            )}
          </div>
          {appliedCoupon && quote.couponError && <p className="text-xs text-red-700 !mb-2">{quote.couponError}</p>}
          {quote.couponCode && <p className="text-xs text-emerald-700 !mb-2">Coupon {quote.couponCode} applied.</p>}

          <dl className="space-y-3 text-sm border-t border-[var(--border)] pt-4 mb-6">
            <div className="flex justify-between text-[var(--text-muted)]">
              <dt>Subtotal</dt>
              <dd>{formatINR(t.subtotal)}</dd>
            </div>
            {t.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Discount</dt>
                <dd>−{formatINR(t.discountTotal)}</dd>
              </div>
            )}
            <div className="flex justify-between text-[var(--text-muted)]">
              <dt>Insured shipping</dt>
              <dd>{t.shippingTotal === 0 ? <span className="text-emerald-700 font-semibold uppercase text-xs">Free</span> : formatINR(t.shippingTotal)}</dd>
            </div>
            {t.codFee > 0 && (
              <div className="flex justify-between text-[var(--text-muted)]">
                <dt>Cash on delivery fee</dt>
                <dd>{formatINR(t.codFee)}</dd>
              </div>
            )}
            <div className="h-px bg-[var(--border)] my-2" />
            <div className="flex justify-between text-lg font-bold text-[var(--navy)]">
              <dt>Total</dt>
              <dd>{formatINR(t.grandTotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <dt>Includes GST</dt>
              <dd>{formatINR(t.taxTotal)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={isPlacing || isQuoting || (Boolean(pincode) && !quote.shipping)}
            className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 disabled:opacity-60 rounded"
          >
            {isPlacing ? "Placing order…" : paymentMethod === "COD" ? `Place order · ${formatINR(t.grandTotal)}` : `Pay ${formatINR(t.grandTotal)}`}
          </button>
          <p className="mt-4 text-[10px] text-center text-[var(--text-muted)] !mb-0">
            By placing your order you agree to our terms, shipping and returns policies.
          </p>
        </div>
      </aside>
    </form>
  );
}
