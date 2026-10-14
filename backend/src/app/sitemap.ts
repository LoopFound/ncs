import type { MetadataRoute } from "next";
import { getAllProductSlugs, getCategoryTree, type CategoryNode } from "@/server/services/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3100";
  const [tree, products] = await Promise.all([getCategoryTree(), getAllProductSlugs()]);
  const flatten = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);

  const staticPages = ["", "/shop", "/new", "/collections", "/about", "/contact", "/faq", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];

  return [
    ...staticPages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...flatten(tree).map((c) => ({ url: `${base}/${c.path}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
