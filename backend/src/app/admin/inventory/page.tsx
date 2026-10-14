import Link from "next/link";
import { db } from "@/server/db";
import { PageHeader, Table, td, Badge } from "@/components/admin/ui";
import StockAdjuster from "@/components/admin/StockAdjuster";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const lowOnly = filter !== "all";
  const variants = await db.productVariant.findMany({
    where: { product: { status: { not: "ARCHIVED" } } },
    include: { product: { select: { id: true, name: true, status: true } } },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
  });
  const rows = lowOnly ? variants.filter((v) => v.stock <= v.lowStockThreshold) : variants;
  const units = variants.reduce((a, v) => a + v.stock, 0);

  return (
    <>
      <PageHeader
        title="Inventory"
        description={`${variants.length} SKUs · ${units} units in stock`}
        actions={
          <Link href={lowOnly ? "/admin/inventory?filter=all" : "/admin/inventory"} className="px-4 py-2 border border-[var(--navy)] text-xs uppercase tracking-widest">
            {lowOnly ? "Show all SKUs" : "Show low stock only"}
          </Link>
        }
      />
      <Table head={["SKU", "Product", "In stock", "Alert at", "Adjust"]} empty={rows.length ? undefined : "No SKUs are low on stock."}>
        {rows.map((v) => (
          <tr key={v.id}>
            <td className={`${td} font-mono text-xs`}>{v.sku}</td>
            <td className={td}>
              <Link href={`/admin/products/${v.product.id}`} className="hover:underline">
                {v.product.name}
              </Link>
              {v.product.status !== "ACTIVE" && <span className="ml-2 text-xs text-[var(--text-muted)]">({v.product.status.toLowerCase()})</span>}
            </td>
            <td className={td}>
              <Badge tone={v.stock === 0 ? "bad" : v.stock <= v.lowStockThreshold ? "warn" : "good"}>{v.stock}</Badge>
            </td>
            <td className={td}>{v.lowStockThreshold}</td>
            <td className={td}>
              <StockAdjuster variantId={v.id} stock={v.stock} compact />
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
