"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addressSchema, reviewSchema } from "@/lib/validation";
import { db } from "../db";
import { assertUser } from "../session";
import { invalidateTags, CacheTags } from "../cache";
import { run, type ActionResult } from "./result";
import { OrderError } from "../services/orders";

const id = z.string().min(1).max(64);

export async function saveAddressAction(input: unknown, addressId?: string): Promise<ActionResult<{ id: string }>> {
  return run("address.save", async () => {
    const user = await assertUser();
    const a = addressSchema.parse(input);
    const data = { ...a, line2: a.line2 || null, landmark: a.landmark || null };
    if (addressId) {
      const { count } = await db.address.updateMany({ where: { id: id.parse(addressId), userId: user.id }, data });
      if (count !== 1) throw new OrderError("Address not found.");
      revalidatePath("/account/addresses");
      return { id: addressId };
    }
    const existing = await db.address.count({ where: { userId: user.id } });
    if (existing >= 20) throw new OrderError("You can save up to 20 addresses.");
    const created = await db.address.create({ data: { ...data, userId: user.id, isDefault: existing === 0 } });
    revalidatePath("/account/addresses");
    return { id: created.id };
  });
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  return run("address.delete", async () => {
    const user = await assertUser();
    await db.address.deleteMany({ where: { id: id.parse(addressId), userId: user.id } });
    revalidatePath("/account/addresses");
    return undefined;
  });
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  return run("address.default", async () => {
    const user = await assertUser();
    await db.$transaction([
      db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      db.address.updateMany({ where: { id: id.parse(addressId), userId: user.id }, data: { isDefault: true } }),
    ]);
    revalidatePath("/account/addresses");
    return undefined;
  });
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  return run("profile.update", async () => {
    const user = await assertUser();
    const { name } = z.object({ name: z.string().trim().min(2, "Enter your name").max(80) }).parse(input);
    await db.user.update({ where: { id: user.id }, data: { name } });
    revalidatePath("/account");
    return undefined;
  });
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ wishlisted: boolean }>> {
  return run("wishlist.toggle", async () => {
    const user = await assertUser();
    const pid = id.parse(productId);
    const key = { userId_productId: { userId: user.id, productId: pid } };
    const existing = await db.wishlistItem.findUnique({ where: key });
    if (existing) {
      await db.wishlistItem.delete({ where: key });
      return { wishlisted: false };
    }
    await db.wishlistItem.create({ data: { userId: user.id, productId: pid } });
    return { wishlisted: true };
  });
}

/** Reviews are limited to customers with a delivered order for the product (no anonymous or fake reviews). */
export async function submitReviewAction(input: unknown): Promise<ActionResult> {
  return run("review.submit", async () => {
    const user = await assertUser();
    const r = reviewSchema.parse(input);
    const purchased = await db.orderItem.findFirst({
      where: { productId: r.productId, order: { userId: user.id, status: { in: ["DELIVERED", "RETURN_REQUESTED"] } } },
    });
    if (!purchased) throw new OrderError("You can review products once your order has been delivered.");
    await db.review.upsert({
      where: { productId_userId: { productId: r.productId, userId: user.id } },
      create: { productId: r.productId, userId: user.id, rating: r.rating, title: r.title || null, body: r.body, isVerifiedPurchase: true },
      update: { rating: r.rating, title: r.title || null, body: r.body, status: "PENDING" },
    });
    await invalidateTags([CacheTags.content]);
    return undefined;
  });
}
