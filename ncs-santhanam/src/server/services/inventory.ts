import type { Tx } from "../db";

export class OutOfStockError extends Error {
  constructor(public readonly sku: string, public readonly name: string) {
    super(`${name} is no longer available in the requested quantity.`);
    this.name = "OutOfStockError";
  }
}

/**
 * Reserves stock for an order inside the caller's transaction. Each decrement is a
 * single conditional UPDATE, so concurrent checkouts can never oversell
 * (the stock >= 0 CHECK constraint is a second line of defence).
 */
export async function reserveStock(
  tx: Tx,
  orderId: string,
  items: { variantId: string; quantity: number; sku: string; name: string }[],
) {
  // Lock rows in a stable order to avoid deadlocks between concurrent orders.
  for (const item of [...items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: item.variantId, isActive: true, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (count !== 1) throw new OutOfStockError(item.sku, item.name);
    await tx.inventoryMovement.create({
      data: { variantId: item.variantId, delta: -item.quantity, reason: "ORDER_RESERVED", orderId },
    });
  }
}

/** Returns an order's reserved stock (cancellation / payment timeout / return). */
export async function releaseStock(tx: Tx, orderId: string, reason: "ORDER_RELEASED" | "ORDER_RETURNED" = "ORDER_RELEASED") {
  const items = await tx.orderItem.findMany({ where: { orderId, variantId: { not: null } } });
  for (const item of items) {
    await tx.productVariant.update({ where: { id: item.variantId! }, data: { stock: { increment: item.quantity } } });
    await tx.inventoryMovement.create({
      data: { variantId: item.variantId!, delta: item.quantity, reason, orderId },
    });
  }
}

export async function adjustStock(tx: Tx, variantId: string, delta: number, actorId: string, note?: string) {
  if (!Number.isInteger(delta) || delta === 0) throw new Error("Adjustment must be a non-zero whole number");
  if (delta < 0) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: variantId, stock: { gte: -delta } },
      data: { stock: { increment: delta } },
    });
    if (count !== 1) throw new Error("Stock cannot go below zero");
  } else {
    await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: delta } } });
  }
  await tx.inventoryMovement.create({
    data: { variantId, delta, reason: delta > 0 ? "RESTOCK" : "ADJUSTMENT", actorId, note },
  });
}
