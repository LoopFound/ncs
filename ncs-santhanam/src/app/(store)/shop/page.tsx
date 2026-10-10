import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductListing, { parseListingParams, type ListingSearchParams } from "@/components/shop/ProductListing";
import { getCategoryByPath, getCategoryTree, listProducts } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<ListingSearchParams>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q;
  return q
    ? { title: `Search: ${String(q).slice(0, 60)}`, robots: { index: false } }
    : { title: "All Silk Sarees", alternates: { canonical: "/shop" } };
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;

  // Legacy links: /shop?category=wedding → /wedding
  const legacy = typeof sp.category === "string" ? sp.category.toLowerCase().replace(/\s+/g, "-") : null;
  if (legacy) {
    const aliases: Record<string, string> = { gifts: "gift-sarees" };
    const path = aliases[legacy] ?? legacy;
    if (await getCategoryByPath(path)) redirect(`/${path}`);
  }

  const input = parseListingParams(sp);
  const [page, tree] = await Promise.all([listProducts(input), getCategoryTree()]);

  return (
    <ProductListing
      eyebrow={input.q ? "Search results" : "All products"}
      title={input.q ? `“${input.q}”` : "The Heritage Collection"}
      page={page}
      tree={tree}
      basePath="/shop"
      searchParams={sp}
    />
  );
}
