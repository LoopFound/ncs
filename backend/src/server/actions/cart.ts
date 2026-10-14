"use server";

import { z } from "zod";
import { persistAnonymousCartId, resolveCartIdentity } from "../cart-session";
import { addItem, CartError, setQuantity, type CartView } from "../services/cart";
import { rateLimit } from "../rate-limit";
import { run, type ActionResult } from "./result";

const idSchema = z.string().min(1).max(64);
const qtySchema = z.number().int().min(0).max(100);

export async function addToCartAction(variantId: string, quantity = 1): Promise<ActionResult<CartView>> {
  return run("cart.add", async () => {
    const identity = await resolveCartIdentity({ mutable: true });
    const rl = await rateLimit("cart", identity.userId ?? identity.anonymousId ?? "anon", 60, 60);
    if (!rl.ok) throw new CartError("You are adding items too quickly. Please wait a moment.");
    const { cart, anonymousId } = await addItem(identity, idSchema.parse(variantId), qtySchema.min(1).parse(quantity));
    if (!identity.userId) await persistAnonymousCartId(anonymousId);
    return cart;
  });
}

export async function updateCartQuantityAction(variantId: string, quantity: number): Promise<ActionResult<CartView>> {
  return run("cart.update", async () => setQuantity(await resolveCartIdentity({ mutable: true }), idSchema.parse(variantId), qtySchema.parse(quantity)));
}

export async function removeFromCartAction(variantId: string): Promise<ActionResult<CartView>> {
  return run("cart.remove", async () => setQuantity(await resolveCartIdentity({ mutable: true }), idSchema.parse(variantId), 0));
}
