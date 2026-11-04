import { randomBytes, randomUUID } from "node:crypto";
import { db, type Prisma } from "../db";
import { includedGst } from "@/lib/money";

export interface CartIdentity {
  userId: string | null;
  anonymousId: string | null;
}

export interface CartLine {
  itemId: string;
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  categoryName: string;
  unit: "PIECE" | "METRE";
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  maxQuantity: number;
  lineTotal: number;
  available: boolean;
}

export interface CartView {
  id: string | null;
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  estimatedTax: number;
  warnings: string[];
}

export const EMPTY_CART: CartView = { id: null, lines: [], itemCount: 0, subtotal: 0, estimatedTax: 0, warnings: [] };

export class CartError extends Error {}

export const newAnonymousCartId = () => randomBytes(24).toString("base64url");

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: {
            include: {
              category: { select: { name: true, gstRateBps: true, hsnCode: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

async function findCart(identity: CartIdentity): Promise<CartRow | null> {
  if (identity.userId) return db.cart.findUnique({ where: { userId: identity.userId }, include: cartInclude });
  if (identity.anonymousId) return db.cart.findUnique({ where: { anonymousId: identity.anonymousId }, include: cartInclude });
  return null;
}

function toView(cart: CartRow | null): CartView {
  if (!cart) return EMPTY_CART;
  const warnings: string[] = [];
  const lines: CartLine[] = cart.items.map((item) => {
    const v = item.variant;
    const p = v.product;
    const sellable = v.isActive && p.status === "ACTIVE";
    const maxQuantity = Math.max(0, Math.min(v.stock, v.maxPerOrder));
    const available = sellable && v.stock >= item.quantity;
    if (!sellable) warnings.push(`${p.name} is no longer available.`);
    else if (v.stock === 0) warnings.push(`${p.name} is out of stock.`);
    else if (v.stock < item.quantity) warnings.push(`Only ${v.stock} of ${p.name} left — please reduce the quantity.`);
    return {
      itemId: item.id,
      variantId: v.id,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0]?.url ?? null,
      categoryName: p.category.name,
      unit: v.unit,
      unitPrice: v.price,
      compareAtPrice: v.compareAtPrice,
      quantity: item.quantity,
      maxQuantity,
      lineTotal: v.price * item.quantity,
      available,
    };
  });
  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const estimatedTax = cart.items.reduce((a, item, i) => {
    const rate = item.variant.product.gstRateBps ?? item.variant.product.category.gstRateBps;
    return a + includedGst(lines[i].lineTotal, rate);
  }, 0);
  return {
    id: cart.id,
    lines,
    itemCount: lines.reduce((a, l) => a + l.quantity, 0),
    subtotal,
    estimatedTax,
    warnings,
  };
}

export async function getCart(identity: CartIdentity): Promise<CartView> {
  return toView(await findCart(identity));
}

async function ensureCart(identity: CartIdentity): Promise<{ cartId: string; anonymousId: string | null }> {
  if (identity.userId) {
    const cart = await db.cart.upsert({ where: { userId: identity.userId }, create: { userId: identity.userId }, update: {} });
    return { cartId: cart.id, anonymousId: null };
  }
  const anonymousId = identity.anonymousId ?? newAnonymousCartId();
  const cart = await db.cart.upsert({ where: { anonymousId }, create: { anonymousId }, update: {} });
  return { cartId: cart.id, anonymousId };
}

async function sellableVariant(variantId: string) {
  const v = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { status: true, name: true } } },
  });
  if (!v || !v.isActive || v.product.status !== "ACTIVE") throw new CartError("This item is no longer available.");
  return v;
}

/** Adds quantity to the cart. Returns the new view and the anonymous id (to persist in a cookie). */
export async function addItem(identity: CartIdentity, variantId: string, quantity = 1) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new CartError("Invalid quantity.");
  const v = await sellableVariant(variantId);
  if (v.stock < 1) throw new CartError(`${v.product.name} is out of stock.`);
  const { cartId, anonymousId } = await ensureCart(identity);
  const limit = Math.max(1, Math.min(v.stock, v.maxPerOrder));
  // Single atomic upsert: concurrent adds can never overshoot the limit, and a line already at the
  // limit is left untouched (no row returned) so we can report it.
  const rows = await db.$queryRaw<{ quantity: number }[]>`
    INSERT INTO cart_items (id, "cartId", "variantId", quantity, "createdAt", "updatedAt")
    VALUES (${randomUUID()}, ${cartId}, ${variantId}, LEAST(${quantity}::int, ${limit}::int), now(), now())
    ON CONFLICT ("cartId", "variantId") DO UPDATE
      SET quantity = LEAST(cart_items.quantity + ${quantity}::int, ${limit}::int), "updatedAt" = now()
      WHERE cart_items.quantity < ${limit}::int
    RETURNING quantity`;
  if (rows.length === 0) {
    throw new CartError(limit === v.stock ? `Only ${v.stock} of ${v.product.name} available.` : `You can order up to ${limit} of this item.`);
  }
  await db.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return { cart: await getCart({ userId: identity.userId, anonymousId }), anonymousId };
}

/** Sets an exact quantity; 0 removes the line. */
export async function setQuantity(identity: CartIdentity, variantId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100) throw new CartError("Invalid quantity.");
  const cart = await findCart(identity);
  if (!cart) return EMPTY_CART;
  if (quantity === 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  } else {
    const v = await sellableVariant(variantId);
    const limit = Math.min(v.stock, v.maxPerOrder);
    if (quantity > limit) throw new CartError(`Only ${limit} available.`);
    await db.cartItem.updateMany({ where: { cartId: cart.id, variantId }, data: { quantity } });
  }
  return getCart(identity);
}

export interface SlugCartItem {
  slug: string;
  quantity: number;
}

export interface SlugCartSync {
  cart: CartView;
  /** Requested slugs with no ACTIVE product / active variant. */
  missing: string[];
  /** Adjustments made while syncing (out of stock, quantity capped), followed by the cart's own warnings. */
  warnings: string[];
}

/**
 * Replaces the whole cart with the given products (by slug), for a storefront that keeps its own
 * cart client-side. Each slug maps to the first active variant of an ACTIVE product. Quantities are
 * capped by stock and maxPerOrder exactly like addItem; out-of-stock products are skipped with a warning.
 */
export async function replaceCartBySlug(identity: CartIdentity, items: SlugCartItem[]): Promise<SlugCartSync> {
  const requested = new Map<string, number>();
  for (const { slug, quantity } of items) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) throw new CartError("Invalid quantity.");
    requested.set(slug, (requested.get(slug) ?? 0) + quantity);
  }

  const products = requested.size
    ? await db.product.findMany({
        where: { slug: { in: [...requested.keys()] }, status: "ACTIVE" },
        select: {
          slug: true,
          name: true,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            take: 1,
            select: { id: true, stock: true, maxPerOrder: true },
          },
        },
      })
    : [];
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const missing: string[] = [];
  const warnings: string[] = [];
  const lines: { variantId: string; quantity: number }[] = [];
  for (const [slug, wanted] of requested) {
    const product = bySlug.get(slug);
    const v = product?.variants[0];
    if (!product || !v) {
      missing.push(slug);
      continue;
    }
    if (v.stock < 1) {
      warnings.push(`${product.name} is out of stock.`);
      continue;
    }
    const limit = Math.max(1, Math.min(v.stock, v.maxPerOrder));
    if (wanted > limit) {
      warnings.push(limit === v.stock ? `Only ${v.stock} of ${product.name} available.` : `You can order up to ${limit} of ${product.name}.`);
    }
    lines.push({ variantId: v.id, quantity: Math.min(wanted, limit) });
  }

  const anonymousId = identity.userId ? null : (identity.anonymousId ?? newAnonymousCartId());
  await db.$transaction(async (tx) => {
    // Create-or-touch the cart in one statement; the row lock it takes lasts until commit, so
    // concurrent syncs of the same cart run one after another instead of interleaving.
    const [{ id: cartId }] = identity.userId
      ? await tx.$queryRaw<{ id: string }[]>`
          INSERT INTO carts (id, "userId", "createdAt", "updatedAt") VALUES (${randomUUID()}, ${identity.userId}, now(), now())
          ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = now() RETURNING id`
      : await tx.$queryRaw<{ id: string }[]>`
          INSERT INTO carts (id, "anonymousId", "createdAt", "updatedAt") VALUES (${randomUUID()}, ${anonymousId}, now(), now())
          ON CONFLICT ("anonymousId") DO UPDATE SET "updatedAt" = now() RETURNING id`;
    await tx.cartItem.deleteMany({ where: { cartId } });
    if (lines.length) await tx.cartItem.createMany({ data: lines.map((l) => ({ cartId, ...l })) });
  });

  const cart = await getCart({ userId: identity.userId, anonymousId });
  return { cart, missing, warnings: [...new Set([...warnings, ...cart.warnings])] };
}

export async function clearCart(identity: CartIdentity) {
  const cart = await findCart(identity);
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
}

/**
 * Removes carts (items go via cascade) not touched for `olderThanDays` days, in batches.
 * For the worker's periodic maintenance. Returns the number of carts removed.
 */
export async function purgeAbandonedCarts(olderThanDays = 30, batchSize = 1000): Promise<number> {
  if (!Number.isFinite(olderThanDays) || olderThanDays < 1) throw new Error("olderThanDays must be >= 1");
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  let total = 0;
  for (let i = 0; i < 100; i++) {
    const n = await db.cart.deleteMany({
      where: { id: { in: (await db.cart.findMany({ where: { updatedAt: { lt: cutoff } }, orderBy: { updatedAt: "asc" }, take: batchSize, select: { id: true } })).map((c) => c.id) } },
    });
    total += n.count;
    if (n.count < batchSize) break;
  }
  return total;
}

/** Moves a signed-out cart into the customer's account cart after sign-in. */
export async function mergeAnonymousCart(userId: string, anonymousId: string) {
  const anon = await db.cart.findUnique({ where: { anonymousId }, include: { items: { include: { variant: true } } } });
  if (!anon) return;
  await db.$transaction(async (tx) => {
    const userCart = await tx.cart.upsert({ where: { userId }, create: { userId }, update: {} });
    for (const item of anon.items) {
      const existing = await tx.cartItem.findUnique({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
      });
      const limit = Math.max(1, Math.min(item.variant.stock, item.variant.maxPerOrder));
      const quantity = Math.min((existing?.quantity ?? 0) + item.quantity, limit);
      await tx.cartItem.upsert({
        where: { cartId_variantId: { cartId: userCart.id, variantId: item.variantId } },
        create: { cartId: userCart.id, variantId: item.variantId, quantity },
        update: { quantity },
      });
    }
    await tx.cart.delete({ where: { id: anon.id } });
  });
}
