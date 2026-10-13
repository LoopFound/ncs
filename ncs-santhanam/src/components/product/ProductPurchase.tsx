"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { toggleWishlistAction } from "@/server/actions/account";

interface Props {
  productId: string;
  variantId: string;
  name: string;
  inStock: boolean;
  maxQuantity: number;
  unit: "PIECE" | "METRE";
  signedIn: boolean;
  wishlisted: boolean;
}

export default function ProductPurchase({ productId, variantId, name, inStock, maxQuantity, unit, signedIn, wishlisted }: Props) {
  const { addToCart, isPending } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(wishlisted);
  const [savePending, startSave] = useTransition();
  const max = Math.max(1, maxQuantity);

  return (
    <div className="flex flex-col gap-4">
      {inStock && (
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{unit === "METRE" ? "Metres" : "Quantity"}</span>
          <div className="flex items-center border border-[var(--border)] bg-white">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-[var(--cream)]" disabled={qty <= 1}>
              −
            </button>
            <span className="px-4 py-2 text-sm min-w-10 text-center border-x border-[var(--border)]" aria-live="polite">
              {qty}
            </span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(max, q + 1))} className="px-3 py-2 hover:bg-[var(--cream)]" disabled={qty >= max}>
              +
            </button>
          </div>
          {maxQuantity > 0 && maxQuantity <= 3 && <span className="text-xs text-[var(--maroon)]">Only {maxQuantity} left</span>}
        </div>
      )}

      <button
        type="button"
        disabled={!inStock || isPending}
        onClick={() => addToCart(variantId, qty, name)}
        className="w-full bg-[var(--navy)] text-white py-5 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 shadow-xl shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {inStock ? (isPending ? "Adding…" : "Add to Bag") : "Sold Out"}
      </button>

      <button
        type="button"
        disabled={savePending}
        onClick={() => {
          if (!signedIn) {
            router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
            return;
          }
          startSave(async () => {
            const r = await toggleWishlistAction(productId);
            if (r.ok) setSaved(r.data.wishlisted);
          });
        }}
        aria-pressed={saved}
        className="w-full border border-[var(--navy)] text-[var(--navy)] py-5 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--navy)] hover:text-white transition-all duration-300"
      >
        {saved ? "♥ Saved to Wishlist" : "♡ Save to Wishlist"}
      </button>
    </div>
  );
}
