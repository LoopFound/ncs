import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductListing, { parseListingParams, type ListingSearchParams } from "@/components/shop/ProductListing";
import { getCategoryByPath, getCategoryTree, listProducts } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ category: string[] }>;
  searchParams: Promise<ListingSearchParams>;
}

const toPath = (segments: string[]) => segments.map((s) => decodeURIComponent(s).toLowerCase()).join("/");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const found = await getCategoryByPath(toPath(category));
  if (!found) return { title: "Not found" };
  const c = found.category;
  return {
    title: c.name,
    description: c.description ?? `Shop ${c.name} — handwoven pure silk from NCS Santhanam, Kanchipuram.`,
    alternates: { canonical: `/${c.path}` },
    openGraph: { title: `${c.name} | NCS Santhanam`, images: c.image ? [c.image] : undefined },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const path = toPath(category);
  const found = await getCategoryByPath(path);
  if (!found) notFound();

  const [page, tree] = await Promise.all([listProducts({ ...parseListingParams(sp), categoryPath: path }), getCategoryTree()]);
  const parent = found.breadcrumbs.length > 1 ? found.breadcrumbs[found.breadcrumbs.length - 2] : null;

  return (
    <ProductListing
      eyebrow={parent ? parent.name : "Collection"}
      title={found.category.name}
      description={found.category.description}
      page={page}
      tree={tree}
      activePath={path}
      basePath={`/${path}`}
      searchParams={sp}
    />
  );
}
