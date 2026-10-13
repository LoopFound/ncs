import { randomBytes } from "node:crypto";
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
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId, variantId } } });
  const limit = Math.min(v.stock, v.maxPerOrder);
  const next = Math.min((existing?.quantity ?? 0) + quantity, limit);
  if (existing && existing.quantity >= limit) {
    throw new CartError(limit === v.stock ? `Only ${v.stock} of ${v.product.name} available.` : `You can order up to ${limit} of this item.`);
  }
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: next },
    update: { quantity: next },
  });
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

export async function clearCart(identity: CartIdentity) {
  const cart = await findCart(identity);
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id } });
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
