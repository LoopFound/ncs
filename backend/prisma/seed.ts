/**
 * Idempotent seed: categories, catalog, banners, shipping rules and store settings.
 * Safe to re-run — rows are upserted by natural keys and existing stock is preserved.
 *   npx prisma db seed
 */
import "dotenv/config";
import { db } from "../src/server/db";
import { categories, products, heroBanners } from "./seed-data";

const rupees = (r: number) => Math.round(r * 100);

async function seedCategories() {
  const idByPath = new Map<string, string>();
  // Parents before children.
  for (const c of [...categories].sort((a, b) => a.path.split("/").length - b.path.split("/").length)) {
    const segments = c.path.split("/");
    const parentPath = segments.slice(0, -1).join("/");
    const parentId = parentPath ? idByPath.get(parentPath) ?? null : null;
    const row = await db.category.upsert({
      where: { path: c.path },
      create: {
        path: c.path,
        slug: segments.at(-1)!,
        name: c.name,
        description: c.description,
        image: c.image,
        sortOrder: c.sortOrder,
        parentId,
      },
      update: { name: c.name, description: c.description, image: c.image, sortOrder: c.sortOrder, parentId },
    });
    idByPath.set(c.path, row.id);
  }
  return idByPath;
}

async function seedProducts(categoryIds: Map<string, string>) {
  let rank = 0;
  for (const p of products) {
    rank += 1;
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Unknown category ${p.category} for ${p.slug}`);

    const data = {
      name: p.name,
      subtitle: p.subtitle,
      description: p.description,
      story: p.story,
      collection: p.collection,
      fabric: p.fabric,
      weave: p.weave,
      zari: p.zari,
      occasion: p.occasion,
      care: "Dry Clean Only",
      colorName: p.colorName,
      colorHex: p.colorHex,
      craftTime: p.craftTime,
      details: p.details,
      motifs: p.motifs ?? [],
      tags: p.tags,
      isFeatured: p.featured ?? false,
      isSignature: p.signature ?? false,
      isNewArrival: p.newArrival ?? false,
      sortRank: rank,
      status: "ACTIVE" as const,
      categoryId,
    };

    const product = await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });

    await db.productImage.deleteMany({ where: { productId: product.id, storageKey: null } });
    await db.productImage.createMany({
      data: p.images.map((url, i) => ({ productId: product.id, url, alt: `${p.name} — view ${i + 1}`, sortOrder: i })),
    });

    const sku = `NCS-${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`.slice(0, 48);
    await db.productVariant.upsert({
      where: { sku },
      create: {
        productId: product.id,
        sku,
        title: p.unit === "METRE" ? "Per metre" : "Default",
        unit: p.unit ?? "PIECE",
        price: rupees(p.price),
        compareAtPrice: p.compareAtPrice ? rupees(p.compareAtPrice) : null,
        stock: p.stock ?? 5,
        maxPerOrder: p.unit === "METRE" ? 50 : 5,
        movements: { create: { delta: p.stock ?? 5, reason: "RESTOCK", note: "Initial seed stock" } },
      },
      // Never overwrite live stock on re-seed.
      update: {
        price: rupees(p.price),
        compareAtPrice: p.compareAtPrice ? rupees(p.compareAtPrice) : null,
      },
    });
  }
}

async function seedContent() {
  if ((await db.banner.count({ where: { placement: "HERO" } })) === 0) {
    await db.banner.createMany({
      data: heroBanners.map((b, i) => ({ placement: "HERO" as const, ...b, ctaLabel: "Explore", sortOrder: i })),
    });
  }

  if ((await db.shippingRule.count()) === 0) {
    await db.shippingRule.createMany({
      data: [
        {
          name: "Tamil Nadu & Puducherry",
          pincodePrefixes: ["60", "61", "62", "63", "64", "605", "609"],
          rate: 0,
          etaMinDays: 2,
          etaMaxDays: 4,
          priority: 10,
          codAvailable: true,
          codMaxOrderValue: rupees(100000),
        },
        {
          name: "Rest of India",
          pincodePrefixes: [],
          rate: 0,
          etaMinDays: 3,
          etaMaxDays: 6,
          priority: 0,
          codAvailable: true,
          codMaxOrderValue: rupees(50000),
        },
      ],
    });
  }

  await db.storeSettings.upsert({
    where: { id: "default" },
    create: { id: "default", supportEmail: "concierge@ncsanthanam.in", privacyEmail: "privacy@ncsanthanam.in" },
    update: {},
  });
}

async function main() {
  const categoryIds = await seedCategories();
  await seedProducts(categoryIds);
  await seedContent();
  const [c, p, v] = await Promise.all([db.category.count(), db.product.count(), db.productVariant.count()]);
  console.log(`Seeded ${c} categories, ${p} products, ${v} variants.`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
