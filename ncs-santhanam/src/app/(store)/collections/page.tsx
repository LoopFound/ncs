import type { Metadata } from "next";
import Link from "next/link";
import { getCategoryTree } from "@/server/services/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Our Collections",
  description: "Explore handcrafted silks from NCS Santhanam — bridal masterpieces to contemporary elegance.",
  alternates: { canonical: "/collections" },
};

const FALLBACK_IMAGE = "/images/collections/wedding.png";

export default async function CollectionsPage() {
  const tree = await getCategoryTree();

  return (
    <div className="pt-28 lg:pt-36 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="text-center mb-16 lg:mb-20">
          <h1 className="font-serif !text-5xl md:!text-6xl font-light text-[var(--charcoal)] mb-6">Our Collections</h1>
          <p className="text-[var(--charcoal-muted)] max-w-xl mx-auto">
            Explore our range of handcrafted silks, from bridal masterpieces to contemporary elegance.
          </p>
        </header>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {tree.map((c) => (
            <li key={c.id}>
              <Link href={`/${c.path}`} className="group block text-center">
                <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-[var(--greige)]">
                  <img
                    src={c.image ?? c.children.find((s) => s.image)?.image ?? FALLBACK_IMAGE}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                </div>
                <h2 className="font-serif !text-3xl text-[var(--charcoal)] mb-3 group-hover:text-[var(--gold-text)] transition-colors">{c.name}</h2>
                {c.description && <p className="text-[var(--charcoal-light)] text-sm max-w-sm mx-auto mb-4">{c.description}</p>}
                <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--charcoal)] border-b border-[var(--charcoal)] pb-1 group-hover:text-[var(--gold-text)] group-hover:border-[var(--gold)] transition-all">
                  View collection
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
