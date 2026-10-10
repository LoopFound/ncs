import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { db } from "@/server/db";
import ProductCard from "@/components/shop/ProductCard";
import type { ProductCard as Card } from "@/server/services/catalog";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await requireUser("/account/wishlist");
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id, product: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          category: { select: { name: true, path: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
        },
      },
    },
  });

  const cards: Card[] = items.flatMap(({ product: p }) => {
    const v = p.variants[0];
    if (!v) return [];
    return [
      {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        categoryName: p.category.name,
        categoryPath: p.category.path,
        variantId: v.id,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        image: p.images[0]?.url ?? null,
        imageAlt: p.images[0]?.alt ?? p.name,
        inStock: v.stock > 0,
        unit: v.unit,
      },
    ];
  });

  if (cards.length === 0) {
    return (
      <div className="bg-white p-10 border border-[var(--border)] text-center">
        <h2 className="font-serif !text-2xl text-[var(--navy)] mb-3">Your wishlist is empty</h2>
        <p className="text-sm text-[var(--text-muted)]">Tap “Save to Wishlist” on any saree to keep it here.</p>
        <Link href="/shop" className="inline-block mt-2 px-8 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">
          Browse sarees
        </Link>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((c) => (
        <ProductCard key={c.id} product={c} />
      ))}
    </div>
  );
}
