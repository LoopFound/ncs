import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { cached, CacheTags } from "../cache";

// ─── DTOs (plain JSON — safe to cache and pass to client components) ───

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  path: string;
  description: string | null;
  image: string | null;
  showInNav: boolean;
  children: CategoryNode[];
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  categoryName: string;
  categoryPath: string;
  variantId: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  imageAlt: string;
  inStock: boolean;
  unit: "PIECE" | "METRE";
}

export interface ProductDetail extends ProductCard {
  description: string;
  story: string | null;
  collection: string | null;
  fabric: string | null;
  weave: string | null;
  zari: string | null;
  occasion: string | null;
  care: string | null;
  craftTime: string | null;
  colorName: string | null;
  details: string[];
  motifs: string[];
  tags: string[];
  images: { url: string; alt: string }[];
  stock: number;
  maxPerOrder: number;
  sku: string;
  breadcrumbs: { name: string; path: string }[];
  rating: { average: number; count: number };
  seoTitle: string | null;
  seoDescription: string | null;
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc";

export interface ListProductsInput {
  categoryPath?: string;
  q?: string;
  fabric?: string;
  minPrice?: number; // paise
  maxPrice?: number; // paise
  newArrivals?: boolean;
  inStockOnly?: boolean;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}

export interface ProductPage {
  items: ProductCard[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  facets: { fabrics: string[] };
}

const TTL = 300;
const TAGS = [CacheTags.catalog];

const cardInclude = {
  category: { select: { name: true, path: true } },
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow): ProductCard | null {
  const v = p.variants[0];
  if (!v) return null;
  return {
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
  };
}

const cards = (rows: CardRow[]) => rows.map(toCard).filter((c): c is ProductCard => c !== null);

// ─── Categories ───

export function getCategoryTree(): Promise<CategoryNode[]> {
  return cached("categories:tree", { ttlSeconds: TTL, tags: TAGS }, async () => {
    const rows = await db.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    const nodes = new Map<string, CategoryNode>(
      rows.map((c) => [
        c.id,
        { id: c.id, name: c.name, slug: c.slug, path: c.path, description: c.description, image: c.image, showInNav: c.showInNav, children: [] },
      ]),
    );
    const roots: CategoryNode[] = [];
    for (const c of rows) {
      const node = nodes.get(c.id)!;
      const parent = c.parentId ? nodes.get(c.parentId) : undefined;
      if (parent) parent.children.push(node);
      else if (!c.parentId) roots.push(node);
    }
    return roots;
  });
}

/** Finds a category by its full path and returns it with its ancestor trail. */
export async function getCategoryByPath(path: string) {
  let nodes = await getCategoryTree();
  const breadcrumbs: { name: string; path: string }[] = [];
  const segments = path.split("/");
  let node: CategoryNode | undefined;
  for (let i = 0; i < segments.length; i++) {
    const prefix = segments.slice(0, i + 1).join("/");
    node = nodes.find((n) => n.path === prefix);
    if (!node) return null;
    breadcrumbs.push({ name: node.name, path: node.path });
    nodes = node.children;
  }
  return node ? { category: node, breadcrumbs } : null;
}

// ─── Product listing / search ───

const SEARCH_DOC = Prisma.sql`ncs_product_search_doc(p.name, p.subtitle, p.collection, p.tags, p.fabric, p.weave, p.description)`;

export interface NormalizedListInput {
  categoryPath?: string;
  q?: string;
  fabric?: string;
  minPrice?: number;
  maxPrice?: number;
  newArrivals: boolean;
  inStockOnly: boolean;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

const MAX_PAGE = 200;

/** Canonical form of a listing request: trimmed/lowercased text, clamped paging, no undefined keys. */
export function normalizeListInput(input: ListProductsInput): NormalizedListInput {
  const out: NormalizedListInput = {
    newArrivals: Boolean(input.newArrivals),
    inStockOnly: Boolean(input.inStockOnly),
    sort: input.sort ?? "featured",
    page: Math.min(MAX_PAGE, Math.max(1, Math.floor(input.page ?? 1))),
    pageSize: Math.min(60, Math.max(1, Math.floor(input.pageSize ?? 24))),
  };
  const q = input.q?.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 100);
  if (q) out.q = q;
  const cat = input.categoryPath?.trim().toLowerCase();
  if (cat) out.categoryPath = cat;
  const fabric = input.fabric?.trim().toLowerCase();
  if (fabric) out.fabric = fabric;
  if (input.minPrice != null && Number.isFinite(input.minPrice)) out.minPrice = Math.floor(input.minPrice);
  if (input.maxPrice != null && Number.isFinite(input.maxPrice)) out.maxPrice = Math.floor(input.maxPrice);
  return out;
}

/** Stable key: keys are emitted in sorted order so equivalent requests share one entry. */
export function listCacheKey(prefix: string, n: object): string {
  const entries = Object.entries(n)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `${prefix}:${JSON.stringify(Object.fromEntries(entries))}`;
}

function buildWhere(n: NormalizedListInput, opts: { skipFabric?: boolean } = {}): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`p.status = 'ACTIVE'`];
  if (n.categoryPath) {
    const like = n.categoryPath.replace(/[%_\\]/g, "\\$&") + "/%";
    parts.push(Prisma.sql`EXISTS (SELECT 1 FROM categories c WHERE c.id = p."categoryId" AND (lower(c.path) = ${n.categoryPath} OR lower(c.path) LIKE ${like}))`);
  }
  if (n.fabric && !opts.skipFabric) parts.push(Prisma.sql`lower(p.fabric) = ${n.fabric}`);
  if (n.newArrivals) parts.push(Prisma.sql`p."isNewArrival"`);
  const v: Prisma.Sql[] = [Prisma.sql`v."productId" = p.id`, Prisma.sql`v."isActive"`];
  if (n.minPrice != null) v.push(Prisma.sql`v.price >= ${n.minPrice}`);
  if (n.maxPrice != null) v.push(Prisma.sql`v.price <= ${n.maxPrice}`);
  if (n.inStockOnly) v.push(Prisma.sql`v.stock > 0`);
  parts.push(Prisma.sql`EXISTS (SELECT 1 FROM product_variants v WHERE ${Prisma.join(v, " AND ")})`);
  if (n.q) {
    parts.push(
      Prisma.sql`(${SEARCH_DOC} @@ websearch_to_tsquery('simple', ${n.q}) OR p.name % ${n.q})`,
    );
  }
  return Prisma.join(parts, " AND ");
}

function buildOrder(n: NormalizedListInput): Prisma.Sql {
  const minPrice = Prisma.sql`(SELECT MIN(pv.price) FROM product_variants pv WHERE pv."productId" = p.id AND pv."isActive")`;
  const rank = n.q
    ? Prisma.sql`ts_rank(${SEARCH_DOC}, websearch_to_tsquery('simple', ${n.q})) DESC, similarity(p.name, ${n.q}) DESC, `
    : Prisma.empty;
  switch (n.sort) {
    case "price-asc":
      return Prisma.sql`${minPrice} ASC, ${rank}p.id ASC`;
    case "price-desc":
      return Prisma.sql`${minPrice} DESC, ${rank}p.id ASC`;
    case "newest":
      return Prisma.sql`p."createdAt" DESC, p.id ASC`;
    default:
      return Prisma.sql`${rank}p."isFeatured" DESC, p."sortRank" ASC, p.id ASC`;
  }
}

/** Fabric facet values for a filter set (ignoring the fabric filter itself); cached separately from the page. */
function getFabricFacets(n: NormalizedListInput): Promise<string[]> {
  const facetInput = { ...n, fabric: undefined, page: 1, pageSize: 1, sort: "featured" as const };
  const key = listCacheKey("products:facets", {
    categoryPath: n.categoryPath,
    q: n.q,
    minPrice: n.minPrice,
    maxPrice: n.maxPrice,
    newArrivals: n.newArrivals,
    inStockOnly: n.inStockOnly,
  });
  return cached(key, { ttlSeconds: n.q ? 60 : 600, tags: TAGS }, async () => {
    const rows = await db.$queryRaw<{ fabric: string }[]>`
      SELECT DISTINCT p.fabric FROM products p
      WHERE ${buildWhere(facetInput, { skipFabric: true })} AND p.fabric IS NOT NULL
      ORDER BY p.fabric LIMIT 50`;
    return rows.map((r) => r.fabric).filter(Boolean);
  });
}

export async function listProducts(input: ListProductsInput): Promise<ProductPage> {
  const n = normalizeListInput(input);
  const key = listCacheKey("products:list", n);
  // Free-text results are high-cardinality and ranking-sensitive: keep them short-lived.
  const ttl = n.q ? 60 : TTL;

  return cached(key, { ttlSeconds: ttl, tags: TAGS }, async () => {
    const where = buildWhere(n);
    const offset = (n.page - 1) * n.pageSize;
    const [countRows, idRows, fabrics] = await Promise.all([
      db.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*) AS total FROM products p WHERE ${where}`,
      db.$queryRaw<{ id: string }[]>`
        SELECT p.id FROM products p WHERE ${where}
        ORDER BY ${buildOrder(n)} LIMIT ${n.pageSize} OFFSET ${offset}`,
      getFabricFacets(n),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    const ids = idRows.map((r) => r.id);
    const rows = ids.length ? await db.product.findMany({ where: { id: { in: ids } }, include: cardInclude }) : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items = cards(ids.map((id) => byId.get(id)).filter((r): r is CardRow => r !== undefined));

    return {
      items,
      total,
      page: n.page,
      pageSize: n.pageSize,
      pageCount: Math.max(1, Math.ceil(total / n.pageSize)),
      facets: { fabrics: [...fabrics].sort((a, b) => a.localeCompare(b)) },
    };
  });
}

export function getFeaturedProducts(limit = 4): Promise<ProductCard[]> {
  return cached(`products:featured:${limit}`, { ttlSeconds: TTL, tags: TAGS }, async () =>
    cards(
      await db.product.findMany({
        where: { status: "ACTIVE", isFeatured: true },
        include: cardInclude,
        orderBy: { sortRank: "asc" },
        take: limit,
      }),
    ),
  );
}

export interface SignatureProduct extends ProductCard {
  collection: string | null;
  craftTime: string | null;
  zari: string | null;
  fabric: string | null;
  weave: string | null;
  description: string;
  story: string | null;
  motifs: string[];
  occasion: string | null;
  tag: string | null;
}

export function getSignatureProducts(): Promise<SignatureProduct[]> {
  return cached("products:signature", { ttlSeconds: TTL, tags: TAGS }, async () => {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE", isSignature: true },
      include: cardInclude,
      orderBy: { sortRank: "asc" },
      take: 12,
    });
    return rows.flatMap((p) => {
      const card = toCard(p);
      if (!card) return [];
      return [
        {
          ...card,
          collection: p.collection,
          craftTime: p.craftTime,
          zari: p.zari,
          fabric: p.fabric,
          weave: p.weave,
          description: p.description,
          story: p.story,
          motifs: p.motifs,
          occasion: p.occasion,
          tag: p.tags[0] ?? null,
        },
      ];
    });
  });
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  return cached(`product:${slug}`, { ttlSeconds: TTL, tags: [...TAGS, CacheTags.product(slug)] }, async () => {
    const p = await db.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      },
    });
    if (!p || p.variants.length === 0) return null;
    const v = p.variants[0];
    const [rating, crumbs] = await Promise.all([
      db.review.aggregate({ where: { productId: p.id, status: "APPROVED" }, _avg: { rating: true }, _count: true }),
      getCategoryByPath(p.category.path),
    ]);
    return {
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
      description: p.description,
      story: p.story,
      collection: p.collection,
      fabric: p.fabric,
      weave: p.weave,
      zari: p.zari,
      occasion: p.occasion,
      care: p.care,
      craftTime: p.craftTime,
      colorName: p.colorName,
      details: p.details,
      motifs: p.motifs,
      tags: p.tags,
      images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? p.name })),
      stock: v.stock,
      maxPerOrder: v.maxPerOrder,
      sku: v.sku,
      breadcrumbs: crumbs?.breadcrumbs ?? [{ name: p.category.name, path: p.category.path }],
      rating: { average: Number((rating._avg.rating ?? 0).toFixed(1)), count: rating._count },
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    };
  });
}

export function getRelatedProducts(productId: string, categoryPath: string, limit = 4): Promise<ProductCard[]> {
  return cached(`products:related:${productId}:${limit}`, { ttlSeconds: TTL, tags: TAGS }, async () =>
    cards(
      await db.product.findMany({
        where: { status: "ACTIVE", id: { not: productId }, category: { path: categoryPath } },
        include: cardInclude,
        orderBy: { sortRank: "asc" },
        take: limit,
      }),
    ),
  );
}

export interface Suggestion {
  slug: string;
  name: string;
  categoryName: string;
  image: string | null;
  price: number;
}

/** Type-ahead suggestions: prefix/substring + trigram similarity on name. */
export async function suggestProducts(q: string, limit = 6): Promise<Suggestion[]> {
  const term = q.trim().slice(0, 64);
  if (term.length < 2) return [];
  return cached(`products:suggest:${term.toLowerCase()}:${limit}`, { ttlSeconds: 120, tags: TAGS }, async () => {
    const rows = await db.$queryRaw<
      { slug: string; name: string; category_name: string; image: string | null; price: number }[]
    >`
      SELECT p.slug, p.name, c.name AS category_name,
             (SELECT url FROM product_images i WHERE i."productId" = p.id ORDER BY i."sortOrder" LIMIT 1) AS image,
             (SELECT MIN(price) FROM product_variants v WHERE v."productId" = p.id AND v."isActive") AS price
      FROM products p JOIN categories c ON c.id = p."categoryId"
      WHERE p.status = 'ACTIVE' AND (p.name ILIKE ${"%" + term.replace(/[%_\\]/g, "\\$&") + "%"} OR p.name % ${term})
      ORDER BY (p.name ILIKE ${term.replace(/[%_\\]/g, "\\$&") + "%"}) DESC, similarity(p.name, ${term}) DESC
      LIMIT ${limit}`;
    return rows.map((r) => ({ slug: r.slug, name: r.name, categoryName: r.category_name, image: r.image, price: Number(r.price) }));
  });
}

export function getAllProductSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  return cached("products:slugs", { ttlSeconds: 3600, tags: TAGS }, async () =>
    (await db.product.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } })).map((p) => ({
      slug: p.slug,
      updatedAt: p.updatedAt.toISOString(),
    })),
  );
}
