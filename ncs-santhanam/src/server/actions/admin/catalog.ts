"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "../../db";
import { audit } from "../../audit";
import { invalidateTags, CacheTags } from "../../cache";
import { adjustStock } from "../../services/inventory";
import { deletePublicObject } from "../../storage";
import { OrderError } from "../../services/orders";
import { adminRun, checkbox, formObject, id, lines, optRupees, optText, percentToBps, rupees, slugify } from "./shared";

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  slug: z.string().trim().max(80).optional(),
  categoryId: id,
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  subtitle: optText(200),
  description: z.string().trim().min(10, "Add a description").max(5000),
  story: optText(500),
  collection: optText(120),
  fabric: optText(120),
  weave: optText(120),
  zari: optText(120),
  occasion: optText(200),
  care: optText(120),
  colorName: optText(80),
  colorHex: z
    .string()
    .trim()
    .regex(/^(#[0-9a-fA-F]{6})?$/, "Use a hex colour like #8B1E2D")
    .optional()
    .transform((v) => v || null),
  craftTime: optText(80),
  details: lines(30),
  motifs: lines(20),
  tags: lines(20),
  isFeatured: checkbox,
  isSignature: checkbox,
  isNewArrival: checkbox,
  sortRank: z.coerce.number().int().min(0).max(100_000).default(0),
  hsnCode: optText(10),
  gstPercent: z.union([z.literal(""), percentToBps]).optional().transform((v) => (v === "" || v == null ? null : v)),
  seoTitle: optText(70),
  seoDescription: optText(170),
  // Primary variant
  sku: z.string().trim().min(2).max(48).regex(/^[A-Z0-9-]+$/i, "Letters, numbers and dashes only"),
  price: rupees.refine((p) => p > 0, "Price must be above zero"),
  compareAtPrice: optRupees,
  unit: z.enum(["PIECE", "METRE"]),
  maxPerOrder: z.coerce.number().int().min(1).max(100),
  lowStockThreshold: z.coerce.number().int().min(0).max(1000),
  weightGrams: z.coerce.number().int().min(1).max(50_000),
  initialStock: z.coerce.number().int().min(0).max(100_000).optional(),
});

export async function saveProductAction(fd: FormData, productId?: string) {
  return adminRun("product.save", "staff", async (actor) => {
    const p = productSchema.parse(formObject(fd));
    const slug = slugify(p.slug || p.name);
    if (!slug) throw new OrderError("Enter a valid URL slug.");
    const clash = await db.product.findFirst({ where: { slug, NOT: productId ? { id: productId } : undefined } });
    if (clash) throw new OrderError(`Another product already uses the URL “${slug}”.`);
    const skuClash = await db.productVariant.findFirst({ where: { sku: p.sku.toUpperCase(), NOT: productId ? { productId } : undefined } });
    if (skuClash) throw new OrderError(`SKU ${p.sku.toUpperCase()} is already in use.`);

    const product = {
      name: p.name,
      slug,
      categoryId: p.categoryId,
      status: p.status,
      subtitle: p.subtitle,
      description: p.description,
      story: p.story,
      collection: p.collection,
      fabric: p.fabric,
      weave: p.weave,
      zari: p.zari,
      occasion: p.occasion,
      care: p.care,
      colorName: p.colorName,
      colorHex: p.colorHex,
      craftTime: p.craftTime,
      details: p.details,
      motifs: p.motifs,
      tags: p.tags,
      isFeatured: p.isFeatured,
      isSignature: p.isSignature,
      isNewArrival: p.isNewArrival,
      sortRank: p.sortRank,
      hsnCode: p.hsnCode,
      gstRateBps: p.gstPercent,
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    };
    const variant = {
      sku: p.sku.toUpperCase(),
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      unit: p.unit,
      title: p.unit === "METRE" ? "Per metre" : "Default",
      maxPerOrder: p.maxPerOrder,
      lowStockThreshold: p.lowStockThreshold,
      weightGrams: p.weightGrams,
    };

    let savedId = productId;
    if (productId) {
      const existing = await db.product.findUnique({ where: { id: productId }, include: { variants: { orderBy: { createdAt: "asc" }, take: 1 } } });
      if (!existing) throw new OrderError("Product not found.");
      await db.$transaction(async (tx) => {
        await tx.product.update({ where: { id: productId }, data: product });
        if (existing.variants[0]) await tx.productVariant.update({ where: { id: existing.variants[0].id }, data: variant });
        else await tx.productVariant.create({ data: { ...variant, productId } });
      });
      await invalidateTags([CacheTags.catalog, CacheTags.product(existing.slug), CacheTags.product(slug)]);
    } else {
      const stock = p.initialStock ?? 0;
      const created = await db.product.create({
        data: {
          ...product,
          variants: { create: { ...variant, stock, movements: stock > 0 ? { create: { delta: stock, reason: "RESTOCK", actorId: actor.id, note: "Initial stock" } } : undefined } },
        },
      });
      savedId = created.id;
      await invalidateTags([CacheTags.catalog]);
    }
    await audit(actor.id, productId ? "product.update" : "product.create", "product", savedId, { slug, status: p.status, price: p.price });
    revalidatePath("/admin/products");
    return { id: savedId! };
  });
}

export async function archiveProductAction(productId: string) {
  return adminRun("product.archive", "staff", async (actor) => {
    const p = await db.product.update({ where: { id: id.parse(productId) }, data: { status: "ARCHIVED" } });
    await invalidateTags([CacheTags.catalog, CacheTags.product(p.slug)]);
    await audit(actor.id, "product.archive", "product", p.id);
    revalidatePath("/admin/products");
    return undefined;
  });
}

export async function addProductImageAction(productId: string, image: { url: string; key: string | null; alt?: string }) {
  return adminRun("product.image.add", "staff", async (actor) => {
    const pid = id.parse(productId);
    const url = z.string().url().or(z.string().startsWith("/images/")).parse(image.url);
    const max = await db.productImage.aggregate({ where: { productId: pid }, _max: { sortOrder: true } });
    const product = await db.product.findUniqueOrThrow({ where: { id: pid }, select: { slug: true, name: true } });
    await db.productImage.create({
      data: { productId: pid, url, storageKey: image.key, alt: image.alt?.trim() || product.name, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
    await invalidateTags([CacheTags.catalog, CacheTags.product(product.slug)]);
    await audit(actor.id, "product.image.add", "product", pid, { url });
    revalidatePath(`/admin/products/${pid}`);
    return undefined;
  });
}

export async function deleteProductImageAction(imageId: string) {
  return adminRun("product.image.delete", "staff", async (actor) => {
    const img = await db.productImage.delete({ where: { id: id.parse(imageId) }, include: { product: { select: { slug: true } } } });
    if (img.storageKey) await deletePublicObject(img.storageKey).catch(() => undefined);
    await invalidateTags([CacheTags.catalog, CacheTags.product(img.product.slug)]);
    await audit(actor.id, "product.image.delete", "product", img.productId, { url: img.url });
    revalidatePath(`/admin/products/${img.productId}`);
    return undefined;
  });
}

export async function moveProductImageAction(imageId: string, direction: "up" | "down") {
  return adminRun("product.image.move", "staff", async () => {
    const img = await db.productImage.findUniqueOrThrow({ where: { id: id.parse(imageId) }, include: { product: { select: { slug: true } } } });
    const siblings = await db.productImage.findMany({ where: { productId: img.productId }, orderBy: { sortOrder: "asc" } });
    const i = siblings.findIndex((s) => s.id === img.id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= siblings.length) return undefined;
    const reordered = [...siblings];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    await db.$transaction(reordered.map((s, idx) => db.productImage.update({ where: { id: s.id }, data: { sortOrder: idx } })));
    await invalidateTags([CacheTags.catalog, CacheTags.product(img.product.slug)]);
    revalidatePath(`/admin/products/${img.productId}`);
    return undefined;
  });
}

export async function adjustStockAction(variantId: string, delta: number, note: string) {
  return adminRun("inventory.adjust", "staff", async (actor) => {
    const d = z.coerce.number().int().min(-100_000).max(100_000).refine((n) => n !== 0, "Enter a non-zero amount").parse(delta);
    const vid = id.parse(variantId);
    await db.$transaction((tx) => adjustStock(tx, vid, d, actor.id, z.string().trim().max(200).parse(note) || undefined));
    const v = await db.productVariant.findUniqueOrThrow({ where: { id: vid }, include: { product: { select: { slug: true, id: true } } } });
    await invalidateTags([CacheTags.catalog, CacheTags.product(v.product.slug)]);
    await audit(actor.id, "inventory.adjust", "variant", vid, { delta: d, note, stock: v.stock });
    revalidatePath("/admin/inventory");
    revalidatePath(`/admin/products/${v.product.id}`);
    return { stock: v.stock };
  });
}

const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(60).optional(),
  parentId: z.string().optional().transform((v) => v || null),
  description: optText(500),
  image: optText(500),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: checkbox,
  showInNav: checkbox,
  hsnCode: z.string().trim().regex(/^\d{4,8}$/, "HSN codes are 4–8 digits"),
  gstPercent: percentToBps,
  seoTitle: optText(70),
  seoDescription: optText(170),
});

export async function saveCategoryAction(fd: FormData, categoryId?: string) {
  return adminRun("category.save", "staff", async (actor) => {
    const c = categorySchema.parse(formObject(fd));
    const slug = slugify(c.slug || c.name);
    if (categoryId && c.parentId === categoryId) throw new OrderError("A category can't be its own parent.");
    const parent = c.parentId ? await db.category.findUnique({ where: { id: c.parentId } }) : null;
    if (c.parentId && !parent) throw new OrderError("Parent category not found.");
    if (parent?.parentId) throw new OrderError("Categories can be nested one level deep.");
    const path = parent ? `${parent.path}/${slug}` : slug;
    const clash = await db.category.findFirst({ where: { path, NOT: categoryId ? { id: categoryId } : undefined } });
    if (clash) throw new OrderError(`The URL /${path} is already used.`);

    const data = {
      name: c.name, slug, path, parentId: c.parentId, description: c.description, image: c.image, sortOrder: c.sortOrder,
      isActive: c.isActive, showInNav: c.showInNav, hsnCode: c.hsnCode, gstRateBps: c.gstPercent, seoTitle: c.seoTitle, seoDescription: c.seoDescription,
    };
    let saved;
    if (categoryId) {
      const before = await db.category.findUniqueOrThrow({ where: { id: categoryId } });
      saved = await db.$transaction(async (tx) => {
        const updated = await tx.category.update({ where: { id: categoryId }, data });
        // Keep child paths in sync when a parent's slug changes.
        if (before.path !== path) {
          const children = await tx.category.findMany({ where: { parentId: categoryId } });
          for (const ch of children) await tx.category.update({ where: { id: ch.id }, data: { path: `${path}/${ch.slug}` } });
        }
        return updated;
      });
    } else {
      saved = await db.category.create({ data });
    }
    await invalidateTags([CacheTags.catalog]);
    await audit(actor.id, categoryId ? "category.update" : "category.create", "category", saved.id, { path });
    revalidatePath("/admin/categories");
    return { id: saved.id };
  });
}

export async function deleteCategoryAction(categoryId: string) {
  return adminRun("category.delete", "admin", async (actor) => {
    const cid = id.parse(categoryId);
    const [products, children] = await Promise.all([db.product.count({ where: { categoryId: cid } }), db.category.count({ where: { parentId: cid } })]);
    if (products || children) throw new OrderError("Move or delete this category's products and sub-categories first, or deactivate it instead.");
    await db.category.delete({ where: { id: cid } });
    await invalidateTags([CacheTags.catalog]);
    await audit(actor.id, "category.delete", "category", cid);
    revalidatePath("/admin/categories");
    return undefined;
  });
}
