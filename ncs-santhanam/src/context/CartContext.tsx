"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { CartView } from "@/server/services/cart";
import { addToCartAction, removeFromCartAction, updateCartQuantityAction } from "@/server/actions/cart";

const EMPTY: CartView = { id: null, lines: [], itemCount: 0, subtotal: 0, estimatedTax: 0, warnings: [] };

interface Notice {
  kind: "added" | "error";
  message: string;
}

interface CartContextType {
  cart: CartView;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  isPending: boolean;
  addToCart: (variantId: string, quantity?: number, label?: string) => Promise<boolean>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);
  const pathname = usePathname();

  const showNotice = useCallback((n: Notice) => {
    window.clearTimeout(noticeTimer.current);
    setNotice(n);
    noticeTimer.current = window.setTimeout(() => setNotice(null), n.kind === "error" ? 6000 : 3500);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (res.ok) setCart((await res.json()) as CartView);
    } catch {
      /* offline — keep last known cart */
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount and re-sync on cart-sensitive pages (stock/price may have changed).
  const syncKey = pathname === "/cart" || pathname === "/checkout" ? pathname : "elsewhere";
  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<CartView>) : null))
      .then((c) => {
        if (!cancelled && c) setCart(c);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [syncKey]);

  useEffect(() => {
    // The old demo stored carts in localStorage; drop it so stale data never resurfaces.
    try {
      localStorage.removeItem("ncs_cart");
    } catch {
      /* storage blocked */
    }
    return () => window.clearTimeout(noticeTimer.current);
  }, []);

  const mutate = useCallback(
    async (fn: () => Promise<{ ok: true; data: CartView } | { ok: false; error: string }>, onOk?: (c: CartView) => void) => {
      setIsPending(true);
      try {
        const result = await fn();
        if (result.ok) {
          setCart(result.data);
          onOk?.(result.data);
          return true;
        }
        showNotice({ kind: "error", message: result.error });
        await refresh();
        return false;
      } catch {
        showNotice({ kind: "error", message: "Couldn't update your bag. Check your connection and try again." });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [refresh, showNotice],
  );

  const addToCart = useCallback(
    (variantId: string, quantity = 1, label?: string) =>
      mutate(
        () => addToCartAction(variantId, quantity),
        () => showNotice({ kind: "added", message: label ? `${label} added to your bag.` : "Added to your bag." }),
      ),
    [mutate, showNotice],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      await mutate(() => updateCartQuantityAction(variantId, quantity));
    },
    [mutate],
  );

  const removeFromCart = useCallback(
    async (variantId: string) => {
      await mutate(() => removeFromCartAction(variantId));
    },
    [mutate],
  );

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      cartCount: cart.itemCount,
      cartTotal: cart.subtotal,
      isLoading,
      isPending,
      addToCart,
      updateQuantity,
      removeFromCart,
      refresh,
    }),
    [cart, isLoading, isPending, addToCart, updateQuantity, removeFromCart, refresh],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md pointer-events-none">
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              role={notice.kind === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex items-center justify-between gap-4 px-5 py-3 rounded-full shadow-2xl border text-sm ${
                notice.kind === "error" ? "bg-red-950 text-red-50 border-red-400/50" : "bg-[#0B1B4D] text-white border-[#C9A227]"
              }`}
            >
              <span>{notice.message}</span>
              {notice.kind === "added" && (
                <Link href="/cart" className="text-xs uppercase tracking-wider text-[#C9A227] underline font-semibold shrink-0">
                  View bag
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");
  return context;
}
