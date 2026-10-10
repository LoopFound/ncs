import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/server/services/catalog";
import { getProductReviews } from "@/server/services/content";
import { getCurrentUser } from "@/server/session";
import { db } from "@/server/db";
import { env } from "@/server/env";
import { formatINR } from "@/lib/money";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import ProductReviews from "@/components/product/ProductReviews";
import ProductCard from "@/components/shop/ProductCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Not found" };
  const description = p.seoDescription ?? p.description.slice(0, 160);
  return {
    title: p.seoTitle ?? p.name,
    description,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })), type: "website" },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const [related, reviews, wishlisted, canReview] = await Promise.all([
    getRelatedProducts(product.id, product.categoryPath),
    getProductReviews(product.id),
    user ? db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId: product.id } } }).then(Boolean) : false,
    user
      ? db.orderItem
          .findFirst({ where: { productId: product.id, order: { userId: user.id, status: { in: ["DELIVERED", "RETURN_REQUESTED"] } } } })
          .then(Boolean)
      : false,
  ]);

  const base = env().APP_URL;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "NCS Santhanam" },
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${base}${i.url}`)),
    category: product.categoryName,
    offers: {
      "@type": "Offer",
      url: `${base}/shop/${product.slug}`,
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating.average, reviewCount: product.rating.count } }
      : {}),
  };

  const specs = [
    ["Fabric", product.fabric],
    ["Weave", product.weave],
    ["Zari", product.zari],
    ["Occasion", product.occasion],
    ["Colour", product.colorName],
    ["Time on loom", product.craftTime],
    ["Care", product.care],
  ].filter((s): s is [string, string] => Boolean(s[1]));

  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="container mx-auto px-6 lg:px-12">
        <nav aria-label="Breadcrumb" className="text-[10px] uppercase tracking-[0.2em] text-[var(--navy)]/60 mb-10">
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <li>
              <Link href="/" className="hover:text-[var(--gold-text)] transition-colors">
                Home
              </Link>
            </li>
            {product.breadcrumbs.map((b) => (
              <li key={b.path} className="flex items-center gap-3">
                <span aria-hidden="true" className="opacity-30">/</span>
                <Link href={`/${b.path}`} className="hover:text-[var(--gold-text)] transition-colors">
                  {b.name}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-3">
              <span aria-hidden="true" className="opacity-30">/</span>
              <span aria-current="page" className="text-[var(--navy)]">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:sticky lg:top-32 h-fit">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-bold mb-3 block">{product.collection ?? product.categoryName}</span>
            <h1 className="font-serif !text-4xl lg:!text-5xl text-[var(--navy)] mb-3 !leading-[1.1]">{product.name}</h1>
            {product.subtitle && <p className="text-[var(--text-muted)] italic !mb-4">{product.subtitle}</p>}
            {product.rating.count > 0 && (
              <a href="#reviews" className="text-sm text-[var(--gold-text)] hover:underline">
                ★ {product.rating.average} · {product.rating.count} {product.rating.count === 1 ? "review" : "reviews"}
              </a>
            )}
            <div className="flex items-baseline gap-4 mt-5">
              <span className="text-3xl text-[var(--navy)] font-light">{formatINR(product.price)}</span>
              {product.unit === "METRE" && <span className="text-sm text-[var(--text-muted)]">per metre</span>}
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xl text-[var(--navy)]/40 line-through font-light">{formatINR(product.compareAtPrice)}</span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">Inclusive of GST · Complimentary insured shipping within India</p>

            <div className="w-full h-[1px] bg-[var(--border)] my-8" />

            <p className="text-[var(--text-body)] leading-relaxed">{product.description}</p>
            {product.story && <p className="text-[var(--text-body)]/80 italic">“{product.story}”</p>}

            {specs.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm my-8">
                {specs.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{k}</dt>
                    <dd className="text-[var(--navy)]">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {product.motifs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--navy)] mb-3 !font-sans">Motifs woven</h2>
                <ul className="flex flex-wrap gap-2">
                  {product.motifs.map((m) => (
                    <li key={m} className="text-xs px-3 py-1 rounded-full border border-[var(--gold)]/40 text-[var(--gold-text)]">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.details.length > 0 && (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm text-[var(--text-body)]/80 mb-8">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3 items-center">
                    <span className="w-1.5 h-[1px] bg-[var(--gold)] shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            )}

            <ProductPurchase
              productId={product.id}
              variantId={product.variantId}
              name={product.name}
              inStock={product.inStock}
              maxQuantity={Math.min(product.stock, product.maxPerOrder)}
              unit={product.unit}
              signedIn={Boolean(user)}
              wishlisted={wishlisted}
            />

            <ul className="grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-8 mt-10 text-center">
              {["Silk Mark certified", "Secure payments", "Insured delivery"].map((t) => (
                <li key={t} className="text-[9px] uppercase tracking-widest text-[var(--navy)]/70 font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ProductReviews productId={product.id} reviews={reviews} rating={product.rating} canReview={canReview} signedIn={Boolean(user)} />

        {related.length > 0 && (
          <section className="mt-24" aria-labelledby="related-heading">
            <h2 id="related-heading" className="font-serif !text-3xl text-[var(--navy)] mb-8">
              You may also love
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
