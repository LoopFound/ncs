import { isPlaceholderEmail } from "../auth";
import type { SessionUser } from "../session";
import { replaceCartBySlug, type SlugCartItem } from "./cart";
import { listOrdersForUser } from "./orders";

/** Shapes returned by /api/storefront/* (amounts in paise). */
export interface StorefrontUser {
  id: string;
  name: string;
  /** null for phone-OTP accounts, which only have a placeholder address. */
  email: string | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  emailVerified: boolean;
}

export interface StorefrontCartLine {
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string | null;
}

export interface StorefrontCartSync {
  lines: StorefrontCartLine[];
  missing: string[];
  warnings: string[];
}

export interface StorefrontOrder {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  grandTotal: number;
  placedAt: Date;
  items: { productName: string; quantity: number }[];
}

export function toStorefrontUser(user: SessionUser): StorefrontUser {
  return {
    id: user.id,
    name: user.name,
    email: isPlaceholderEmail(user.email) ? null : user.email,
    phoneNumber: user.phoneNumber,
    phoneNumberVerified: user.phoneNumberVerified,
    emailVerified: user.emailVerified,
  };
}

/** Replaces the signed-in customer's server cart with the storefront's cart. */
export async function syncStorefrontCart(userId: string, items: SlugCartItem[]): Promise<StorefrontCartSync> {
  const { cart, missing, warnings } = await replaceCartBySlug({ userId, anonymousId: null }, items);
  return {
    lines: cart.lines.map((l) => ({
      slug: l.slug,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      image: l.image,
    })),
    missing,
    warnings,
  };
}

export async function listStorefrontOrders(userId: string): Promise<StorefrontOrder[]> {
  const orders = await listOrdersForUser(userId);
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
    grandTotal: o.grandTotal,
    placedAt: o.placedAt,
    items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
  }));
}
