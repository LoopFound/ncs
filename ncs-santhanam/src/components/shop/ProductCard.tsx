"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/money";
import type { ProductCard as ProductCardData } from "@/server/services/catalog";

export default function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const { addToCart, isPending } = useCart();
  const href = `/shop/${product.slug}`;
  return (
    <article className="group flex flex-col h-full bg-white p-4 border border-[var(--border)] rounded-sm hover:shadow-lg transition-all duration-300">
      <Link href={href} className="block relative aspect-[3/4] bg-[var(--greige)] overflow-hidden mb-4" tabIndex={-1} aria-hidden="true">
        {product.image && (
          <img
            src={product.image}
            alt=""
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        )}
        {!product.inStock && (
          <span className="absolute top-3 left-3 bg-[var(--navy)] text-white text-[10px] uppercase tracking-widest px-2 py-1">Sold out</span>
        )}
      </Link>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[var(--gold-text)] font-semibold block mb-1">{product.categoryName}</span>
          <h3 className="font-serif !text-lg text-[var(--navy)] group-hover:text-[var(--gold-text)] transition-colors line-clamp-2">
            <Link href={href}>{product.name}</Link>
          </h3>
          <p className="text-sm font-semibold text-[var(--charcoal)] mt-2 !mb-0">
            {formatINR(product.price)}
            {product.unit === "METRE" && <span className="font-normal text-[var(--text-muted)]"> / metre</span>}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="ml-2 font-normal text-[var(--text-muted)] line-through">{formatINR(product.compareAtPrice)}</span>
            )}
          </p>
        </div>

        <button
          type="button"
          disabled={!product.inStock || isPending}
          onClick={() => addToCart(product.variantId, 1, product.name)}
          className="w-full mt-4 py-3 bg-[var(--navy)] text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.inStock ? "Add to Bag" : "Sold Out"}
        </button>
      </div>
    </article>
  );
}
