import type { Metadata } from "next";
import ProductListing, { parseListingParams, type ListingSearchParams } from "@/components/shop/ProductListing";
import { getCategoryTree, listProducts } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The newest handwoven silks from our Kanchipuram looms.",
  alternates: { canonical: "/new" },
};

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<ListingSearchParams> }) {
  const sp = await searchParams;
  const [page, tree] = await Promise.all([listProducts({ ...parseListingParams(sp), newArrivals: true }), getCategoryTree()]);
  return (
    <ProductListing
      eyebrow="Fresh from the loom"
      title="New Arrivals"
      description="The newest handwoven silks from our Kanchipuram looms."
      page={page}
      tree={tree}
      basePath="/new"
      searchParams={sp}
    />
  );
}
