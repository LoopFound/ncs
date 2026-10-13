import Link from "next/link";
import { Suspense } from "react";
import type { CategoryNode, ListProductsInput, ProductPage, ProductSort } from "@/server/services/catalog";
import { getStoreInfo, whatsappLink } from "@/server/services/content";
import ProductCard from "./ProductCard";
import ListingControls from "./ListingControls";

export type ListingSearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Parses shared listing query params (?sort, ?fabric, ?price=min-max in rupees, ?instock, ?page, ?q). */
export function parseListingParams(sp: ListingSearchParams): ListProductsInput {
  const sort = one(sp.sort);
  const [min, max] = one(sp.price).split("-");
  const toPaise = (r: string | undefined) => (r && /^\d+$/.test(r) ? Number(r) * 100 : undefined);
  return {
    q: one(sp.q).slice(0, 80) || undefined,
    sort: (["featured", "newest", "price-asc", "price-desc"].includes(sort) ? sort : "featured") as ProductSort,
    fabric: one(sp.fabric).slice(0, 80) || undefined,
    minPrice: toPaise(min),
    maxPrice: toPaise(max),
    inStockOnly: one(sp.instock) === "1",
    page: Math.max(1, Number.parseInt(one(sp.page) || "1", 10) || 1),
    pageSize: 24,
  };
}

interface Props {
  eyebrow: string;
  title: string;
  description?: string | null;
  page: ProductPage;
  tree: CategoryNode[];
  activePath?: string;
  basePath: string;
  searchParams: ListingSearchParams;
}

function pageHref(basePath: string, sp: ListingSearchParams, page: number) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (val && k !== "page") next.set(k, val);
  }
  if (page > 1) next.set("page", String(page));
  return `${basePath}${next.size ? `?${next}` : ""}`;
}

export default async function ProductListing({ eyebrow, title, description, page, tree, activePath, basePath, searchParams }: Props) {
  const store = await getStoreInfo().catch(() => null);
  const wa = store ? whatsappLink(store, `Hello, I'm looking for ${title}.`) : null;

  return (
    <div className="pt-28 lg:pt-36 pb-24 min-h-[75vh]">
      <div className="container mx-auto px-6 lg:px-12">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-2">{eyebrow}</span>
            <h1 className="font-serif !text-4xl lg:!text-5xl font-light text-[var(--charcoal)]">{title}</h1>
            {description && <p className="text-[var(--text-muted)] max-w-xl mt-3 !mb-0">{description}</p>}
            <p className="text-sm text-[var(--charcoal-muted)] mt-3 font-medium !mb-0">
              {page.total} {page.total === 1 ? "weave" : "weaves"}
            </p>
          </div>
          <Suspense>
            <ListingControls fabrics={page.facets.fabrics} />
          </Suspense>
        </header>

        <div className="grid lg:grid-cols-4 gap-12">
          <nav aria-label="Categories" className="hidden lg:block space-y-8">
            <div>
              <h2 className="font-serif !text-lg mb-4 text-[var(--navy)]">Categories</h2>
              <ul className="space-y-3 text-sm text-[var(--charcoal-light)]">
                <li>
                  <Link href="/shop" className={`hover:text-[var(--gold-text)] ${!activePath && basePath === "/shop" ? "text-[var(--gold-text)] font-semibold" : ""}`}>
                    All weaves
                  </Link>
                </li>
                {tree.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/${c.path}`}
                      aria-current={activePath === c.path ? "page" : undefined}
                      className={`hover:text-[var(--gold-text)] ${activePath === c.path ? "text-[var(--gold-text)] font-semibold" : ""}`}
                    >
                      {c.name}
                    </Link>
                    {c.children.length > 0 && (
                      <ul className="pl-4 mt-2 space-y-2 text-xs border-l border-[var(--border)]">
                        {c.children.map((s) => (
                          <li key={s.id}>
                            <Link
                              href={`/${s.path}`}
                              aria-current={activePath === s.path ? "page" : undefined}
                              className={`hover:text-[var(--gold-text)] ${activePath === s.path ? "text-[var(--gold-text)] font-semibold" : ""}`}
                            >
                              {s.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                <li>
                  <Link href="/new" className={`hover:text-[var(--gold-text)] ${basePath === "/new" ? "text-[var(--gold-text)] font-semibold" : ""}`}>
                    New Arrivals
                  </Link>
                </li>
              </ul>
            </div>
            <div className="w-10 h-[1px] bg-[var(--border)]" />
            <div>
              <h2 className="font-serif !text-lg mb-4 text-[var(--navy)]">Craftsmanship</h2>
              <ul className="space-y-2 text-xs text-[var(--charcoal-light)]">
                {["Silk Mark Authorized", "Pure Silver & Gold Zari", "Interlocking Korvai Technique"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <section className="lg:col-span-3" aria-label="Products">
            {page.items.length > 0 ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {page.items.map((p, i) => (
                    <ProductCard key={p.id} product={p} priority={i < 3} />
                  ))}
                </div>
                {page.pageCount > 1 && (
                  <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-14">
                    {Array.from({ length: page.pageCount }, (_, i) => i + 1).map((n) => (
                      <Link
                        key={n}
                        href={pageHref(basePath, searchParams, n)}
                        aria-current={n === page.page ? "page" : undefined}
                        className={`w-10 h-10 flex items-center justify-center border text-sm ${
                          n === page.page ? "bg-[var(--navy)] text-white border-[var(--navy)]" : "border-[var(--border)] text-[var(--navy)] hover:border-[var(--gold)]"
                        }`}
                      >
                        {n}
                      </Link>
                    ))}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-[var(--cream)]/60 rounded-xl border border-[var(--border)] p-8">
                <h2 className="font-serif !text-2xl text-[var(--navy)] mb-2">No weaves found</h2>
                <p className="text-sm text-[var(--charcoal-light)] max-w-md mx-auto mb-6">
                  Nothing matches these filters right now. Try widening your search or speak to our Kanchipuram concierge.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/shop" className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors">
                    View all silks
                  </Link>
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors">
                      Ask concierge
                    </a>
                  ) : (
                    <Link href="/contact" className="px-6 py-3 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors">
                      Contact us
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
