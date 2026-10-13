import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { redis } from "@/server/redis";
import type { SessionUser } from "@/server/session";

/** Empties every application table and the test Redis DB. */
export async function resetState() {
  const tables = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} RESTART IDENTITY CASCADE`);
  await redis().flushdb();
}

export async function makeProduct(opts: { price?: number; stock?: number; slug?: string } = {}) {
  const slug = opts.slug ?? `saree-${randomUUID().slice(0, 8)}`;
  const category = await db.category.upsert({
    where: { path: "test-silks" },
    create: { name: "Test Silks", slug: "test-silks", path: "test-silks", gstRateBps: 500 },
    update: {},
  });
  const product = await db.product.create({
    data: {
      name: `Test ${slug}`,
      slug,
      description: "A test saree for automated checks.",
      status: "ACTIVE",
      categoryId: category.id,
      variants: { create: { sku: slug.toUpperCase(), price: opts.price ?? 4_500_000, stock: opts.stock ?? 5 } },
    },
    include: { variants: true },
  });
  return { product, variant: product.variants[0] };
}

export async function makeUser(opts: { phoneVerified?: boolean } = {}): Promise<SessionUser> {
  const id = randomUUID();
  const email = `${id.slice(0, 8)}@example.com`;
  const phone = `+9198${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;
  await db.user.create({
    data: { id, name: "Test Customer", email, emailVerified: true, phoneNumber: phone, phoneNumberVerified: opts.phoneVerified ?? true },
  });
  return { id, name: "Test Customer", email, emailVerified: true, phoneNumber: phone, phoneNumberVerified: opts.phoneVerified ?? true, role: "user", image: null };
}

export async function fillCart(userId: string, variantId: string, quantity = 1) {
  const cart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} });
  await db.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity },
    update: { quantity },
  });
}

export const testAddress = {
  fullName: "Radhika Raman",
  phone: "+919876543210",
  line1: "12 Sannathi Street",
  line2: "",
  landmark: "",
  city: "Kancheepuram",
  state: "Tamil Nadu" as const,
  pincode: "631501",
};

export async function seedShipping() {
  await db.shippingRule.create({ data: { name: "All India", rate: 0, codAvailable: true, codMaxOrderValue: 10_000_000 } });
  await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} });
}
