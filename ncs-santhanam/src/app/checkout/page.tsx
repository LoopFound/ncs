"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, cartTotal, removeFromCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
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

  const tax = cartTotal * 0.12;
  const grandTotal = cartTotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate order placement
    setTimeout(() => {
      // Clear cart items
      cartItems.forEach((item) => removeFromCart(item.id));
      router.push("/order-success");
    }, 1200);
  };

  if (cartItems.length === 0) {
    return (
      <div className="pt-32 pb-24 min-h-[70vh] bg-[var(--cream)] flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-xl border border-[var(--border)] shadow-xs">
          <h2 className="font-[var(--font-serif)] text-3xl text-[var(--navy)] mb-3">Your Bag is Empty</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Please add your chosen silk sarees to your shopping bag before proceeding to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors"
          >
            Explore Sarees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)] min-h-screen">
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
          <h1 className="font-[var(--font-serif)] text-4xl text-[var(--navy)]">
            Delivery & Payment Information
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-10">
          {/* Left Form: Details (Span 7) */}
          <div className="lg:col-span-7 space-y-8">
            {/* Contact & Shipping */}
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
              <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
                1. Delivery Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Smt. Radhika Ramanathan"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    Phone Number (for SMS & Courier) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    Email Address (for Invoice) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="radhika@example.com"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    Street Address & House / Flat No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Door No, Street Name, Apartment/Locality"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Chennai"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Tamil Nadu"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy)] mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="600028"
                    className="w-full px-4 py-3 bg-[var(--cream)]/40 border border-[var(--border)] rounded focus:outline-none focus:border-[var(--gold)]"
                  />
                </div>
              </div>
            </div>

            {/* Bespoke Services */}
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
              <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4 pb-2 border-b border-[var(--border)]">
                2. Atelier Saree Customization
              </h2>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.addFallPico}
                    onChange={(e) => setFormData({ ...formData, addFallPico: e.target.checked })}
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
                    checked={formData.giftWrap}
                    onChange={(e) => setFormData({ ...formData, giftWrap: e.target.checked })}
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
              <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4 pb-2 border-b border-[var(--border)]">
                3. Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { id: "upi", label: "UPI & Instant NetBanking (Google Pay, PhonePe, Paytm, BHIM)", badge: "Instant Confirmation" },
                  { id: "card", label: "Credit / Debit Cards (Visa, Mastercard, RuPay, Amex)", badge: "256-Bit Encrypted" },
                  { id: "cod", label: "Cash on Delivery (Available across India)", badge: "Verify on Delivery" },
                ].map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.paymentMethod === method.id
                        ? "border-[var(--gold)] bg-[var(--cream)]/60"
                        : "border-[var(--border)] hover:bg-[var(--cream)]/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={formData.paymentMethod === method.id}
                        onChange={() => setFormData({ ...formData, paymentMethod: method.id })}
                        className="w-4 h-4 text-[var(--gold)]"
                      />
                      <span className="text-sm font-medium text-[var(--navy)]">{method.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-[var(--gold-text)] bg-white px-2 py-0.5 rounded border border-[var(--gold)]/20">
                      {method.badge}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Summary (Span 5) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-sm sticky top-32">
              <h3 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-6 pb-2 border-b border-[var(--border)]">
                Order Summary
              </h3>

              {/* Items List */}
              <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-[var(--greige)] rounded overflow-hidden shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-serif text-sm text-[var(--navy)] font-medium leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Qty: {item.quantity}</p>
                      <p className="text-xs font-semibold text-[var(--navy)] mt-1">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculation */}
              <div className="space-y-3 text-sm border-t border-[var(--border)] pt-4 mb-6">
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Subtotal</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Goods & Services Tax (GST 12%)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[var(--text-muted)]">
                  <span>Insured Express Shipping</span>
                  <span className="text-emerald-700 font-semibold uppercase text-xs">Complimentary</span>
                </div>
                <div className="h-px bg-[var(--border)] my-2" />
                <div className="flex justify-between text-lg font-bold text-[var(--navy)]">
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 disabled:opacity-70 rounded shadow-md"
              >
                {isSubmitting ? "Securing Order..." : "Place Order & Pay"}
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
