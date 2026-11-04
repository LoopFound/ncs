import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { closeQueues } from "@/server/queue";
import { redis } from "@/server/redis";
import { syncStorefrontCart } from "@/server/services/storefront";
import { fillCart, makeProduct, makeUser, resetState } from "./helpers";

beforeEach(async () => {
  await resetState();
});

afterAll(async () => {
  await closeQueues();
  await redis().quit();
  await db.$disconnect();
});

describe("storefront cart sync by slug", () => {
  it("replaces the server cart with the requested products at backend prices", async () => {
    const a = await makeProduct({ slug: "sync-a", price: 1_200_000, stock: 5 });
    const b = await makeProduct({ slug: "sync-b", price: 800_000, stock: 5 });
    const stale = await makeProduct({ slug: "sync-stale", stock: 5 });
    const user = await makeUser();
    await fillCart(user.id, stale.variant.id, 3);

    const r = await syncStorefrontCart(user.id, [
      { slug: "sync-a", quantity: 2 },
      { slug: "sync-b", quantity: 1 },
    ]);

    expect(r.missing).toEqual([]);
    expect(r.warnings).toEqual([]);
    expect(r.lines).toEqual([
      expect.objectContaining({ slug: "sync-a", quantity: 2, unitPrice: 1_200_000, lineTotal: 2_400_000 }),
      expect.objectContaining({ slug: "sync-b", quantity: 1, unitPrice: 800_000, lineTotal: 800_000 }),
    ]);
    const items = await db.cartItem.findMany({ where: { cart: { userId: user.id } } });
    expect(items.map((i) => i.variantId).sort()).toEqual([a.variant.id, b.variant.id].sort());
  });

  it("reports unknown and inactive slugs as missing", async () => {
    const draft = await makeProduct({ slug: "sync-draft" });
    await db.product.update({ where: { id: draft.product.id }, data: { status: "DRAFT" } });
    const noVariant = await makeProduct({ slug: "sync-novariant" });
    await db.productVariant.update({ where: { id: noVariant.variant.id }, data: { isActive: false } });
    await makeProduct({ slug: "sync-ok" });
    const user = await makeUser();

    const r = await syncStorefrontCart(user.id, [
      { slug: "sync-ok", quantity: 1 },
      { slug: "sync-draft", quantity: 1 },
      { slug: "sync-novariant", quantity: 1 },
      { slug: "does-not-exist", quantity: 1 },
    ]);

    expect(r.lines.map((l) => l.slug)).toEqual(["sync-ok"]);
    expect(r.missing.sort()).toEqual(["does-not-exist", "sync-draft", "sync-novariant"]);
  });

  it("caps quantities by stock and per-order limit, and skips out-of-stock products", async () => {
    await makeProduct({ slug: "sync-low", stock: 2 });
    const capped = await makeProduct({ slug: "sync-capped", stock: 50 });
    await db.productVariant.update({ where: { id: capped.variant.id }, data: { maxPerOrder: 3 } });
    await makeProduct({ slug: "sync-empty", stock: 0 });
    const user = await makeUser();

    const r = await syncStorefrontCart(user.id, [
      { slug: "sync-low", quantity: 5 },
      { slug: "sync-capped", quantity: 4 },
      { slug: "sync-empty", quantity: 1 },
    ]);

    expect(Object.fromEntries(r.lines.map((l) => [l.slug, l.quantity]))).toEqual({ "sync-low": 2, "sync-capped": 3 });
    expect(r.missing).toEqual([]);
    expect(r.warnings).toEqual([
      "Only 2 of Test sync-low available.",
      "You can order up to 3 of Test sync-capped.",
      "Test sync-empty is out of stock.",
    ]);
  });

  it("merges duplicate slugs and empties the cart for an empty list", async () => {
    await makeProduct({ slug: "sync-dup", stock: 10 });
    const user = await makeUser();

    const merged = await syncStorefrontCart(user.id, [
      { slug: "sync-dup", quantity: 1 },
      { slug: "sync-dup", quantity: 2 },
    ]);
    expect(merged.lines).toEqual([expect.objectContaining({ slug: "sync-dup", quantity: 3 })]);

    const emptied = await syncStorefrontCart(user.id, []);
    expect(emptied.lines).toEqual([]);
    expect(await db.cartItem.count()).toBe(0);
  });

  it("handles concurrent syncs of the same cart without errors", async () => {
    await makeProduct({ slug: "sync-race-a" });
    await makeProduct({ slug: "sync-race-b" });
    const user = await makeUser();

    await Promise.all([
      syncStorefrontCart(user.id, [{ slug: "sync-race-a", quantity: 1 }]),
      syncStorefrontCart(user.id, [{ slug: "sync-race-b", quantity: 1 }]),
    ]);
    expect(await db.cartItem.count()).toBe(1);
  });
});
