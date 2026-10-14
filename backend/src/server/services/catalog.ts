import { db, type Prisma } from "../db";
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

/** Ranked product ids for a full-text query (uses the products_search_idx GIN index). */
async function searchIds(q: string, limit = 500): Promise<string[]> {
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM products
    WHERE status = 'ACTIVE'
      AND (
        ncs_product_search_doc(name, subtitle, collection, tags, fabric, weave, description)
          @@ websearch_to_tsquery('simple', ${q})
        OR name % ${q}
      )
    ORDER BY ts_rank(
      ncs_product_search_doc(name, subtitle, collection, tags, fabric, weave, description),
      websearch_to_tsquery('simple', ${q})
    ) DESC, similarity(name, ${q}) DESC
    LIMIT ${limit}`;
  return rows.map((r) => r.id);
}

export async function listProducts(input: ListProductsInput): Promise<ProductPage> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(60, Math.max(1, Math.floor(input.pageSize ?? 24)));
  const sort = input.sort ?? "featured";
  const key = `products:list:${JSON.stringify({ ...input, page, pageSize, sort })}`;

  return cached(key, { ttlSeconds: TTL, tags: TAGS }, async () => {
    const where: Prisma.ProductWhereInput = { status: "ACTIVE", variants: { some: { isActive: true } } };
    if (input.categoryPath) {
      where.category = { OR: [{ path: input.categoryPath }, { path: { startsWith: `${input.categoryPath}/` } }] };
    }
    if (input.fabric) where.fabric = { equals: input.fabric, mode: "insensitive" };
    if (input.newArrivals) where.isNewArrival = true;
    const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
    if (input.minPrice != null || input.maxPrice != null) {
      variantFilter.price = { gte: input.minPrice ?? undefined, lte: input.maxPrice ?? undefined };
    }
    if (input.inStockOnly) variantFilter.stock = { gt: 0 };
    where.variants = { some: variantFilter };

    let rankedIds: string[] | undefined;
    if (input.q && input.q.trim().length > 0) {
      rankedIds = await searchIds(input.q.trim());
      where.id = { in: rankedIds };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sort === "newest"
        ? [{ createdAt: "desc" }]
        : [{ isFeatured: "desc" }, { sortRank: "asc" }];

    const [total, rows, fabricRows] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        include: cardInclude,
        orderBy,
        // Price sorting and search ranking need the full candidate set; others paginate in SQL.
        ...(sort === "price-asc" || sort === "price-desc" || rankedIds
          ? {}
          : { skip: (page - 1) * pageSize, take: pageSize }),
      }),
      db.product.findMany({
        where: { ...where, fabric: undefined },
        select: { fabric: true },
        distinct: ["fabric"],
      }),
    ]);

    let items = cards(rows);
    if (rankedIds && sort === "featured") {
      const pos = new Map(rankedIds.map((id, i) => [id, i]));
      items.sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
    }
    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (rankedIds || sort === "price-asc" || sort === "price-desc") {
      items = items.slice((page - 1) * pageSize, page * pageSize);
    }

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      facets: {
        fabrics: fabricRows
          .map((f) => f.fabric)
          .filter((f): f is string => Boolean(f))
          .sort((a, b) => a.localeCompare(b)),
      },
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
