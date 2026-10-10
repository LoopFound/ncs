"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const { cart, isLoading, isPending, updateQuantity, removeFromCart } = useCart();
  const blocked = cart.lines.some((l) => !l.available);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <h1 className="font-serif !text-4xl lg:!text-5xl text-[var(--navy)]">Your Shopping Bag</h1>
          <p className="text-[var(--text-muted)] mt-2 uppercase tracking-widest text-xs">
            {isLoading ? "Loading…" : `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"} in your bag`}
          </p>
        </div>

        {cart.warnings.length > 0 && (
          <div role="alert" className="mb-8 p-4 border border-amber-300 bg-amber-50 text-amber-900 text-sm space-y-1">
            {cart.warnings.map((w) => (
              <p key={w} className="!mb-0 !text-sm">
                {w}
              </p>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="h-64 animate-pulse bg-white/60" />
        ) : cart.lines.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-12">
            <ul className={`lg:col-span-2 space-y-8 ${isPending ? "opacity-70" : ""}`} aria-busy={isPending}>
              {cart.lines.map((item) => (
                <motion.li
                  key={item.variantId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row gap-6 p-6 bg-white border border-[var(--border)] shadow-sm"
                >
                  <Link href={`/shop/${item.slug}`} className="w-full sm:w-32 aspect-[3/4] bg-[var(--greige)] shrink-0 overflow-hidden">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--gold-text)] !mb-1">{item.categoryName}</p>
                        <h2 className="font-serif !text-xl text-[var(--navy)]">
                          <Link href={`/shop/${item.slug}`}>{item.name}</Link>
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] !mb-0">
                          {formatINR(item.unitPrice)}
                          {item.unit === "METRE" ? " per metre" : " each"}
                        </p>
                      </div>
                      <p className="font-medium shrink-0">{formatINR(item.lineTotal)}</p>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex items-center border border-[var(--border)] rounded-sm">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={isPending || item.quantity <= 1}
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-[var(--cream)] transition-colors disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 text-sm border-x border-[var(--border)]" aria-label="Quantity">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${item.name}`}
                          disabled={isPending || item.quantity >= item.maxQuantity}
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-[var(--cream)] transition-colors disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-[10px] uppercase tracking-widest text-red-700 hover:text-red-900 transition-colors underline underline-offset-4"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>

            <aside className="lg:col-span-1">
              <div className="bg-white border border-[var(--border)] p-8 sticky top-32">
                <h2 className="font-serif !text-2xl text-[var(--navy)] mb-6">Order Summary</h2>
                <dl className="space-y-4 mb-8 text-sm">
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <dt>Subtotal</dt>
                    <dd>{formatINR(cart.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <dt>Includes GST</dt>
                    <dd>{formatINR(cart.estimatedTax)}</dd>
                  </div>
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <dt>Shipping</dt>
                    <dd className="text-xs">Calculated at checkout</dd>
                  </div>
                  <div className="h-[1px] bg-[var(--border)] my-6" />
                  <div className="flex justify-between text-lg font-medium text-[var(--navy)]">
                    <dt>Total</dt>
                    <dd>{formatINR(cart.subtotal)}</dd>
                  </div>
                </dl>

                {blocked ? (
                  <p className="text-sm text-amber-800">Please update the items marked above before checking out.</p>
                ) : (
                  <Link
                    href="/checkout"
                    className="block text-center w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                  >
                    Proceed to Checkout
                  </Link>
                )}
                <p className="mt-6 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Prices include GST · Secure payments via Razorpay</p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="max-w-xl mx-auto text-center py-20">
            <h2 className="font-serif !text-3xl text-[var(--navy)] mb-4">Your bag is empty</h2>
            <p className="text-[var(--text-muted)] mb-10 leading-relaxed">Discover our handcrafted silk sarees and find your perfect masterpiece.</p>
            <Link
              href="/shop"
              className="inline-block px-10 py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
