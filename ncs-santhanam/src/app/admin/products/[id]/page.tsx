import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { PageHeader, Card, Badge, btn } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";
import ImageManager from "@/components/admin/ImageManager";
import StockAdjuster from "@/components/admin/StockAdjuster";
import ArchiveProductButton from "@/components/admin/ArchiveProductButton";
import { categoryOptions } from "@/server/services/admin-queries";

export const metadata = { title: "Edit product" };

const rupees = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100));

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [p, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { createdAt: "asc" }, include: { movements: { orderBy: { createdAt: "desc" }, take: 15 } } },
      },
    }),
    categoryOptions(),
  ]);
  if (!p) notFound();
  const v = p.variants[0];

  return (
    <>
      <PageHeader
        title={p.name}
        description={`/shop/${p.slug}`}
        actions={
          <>
            <Badge tone={p.status === "ACTIVE" ? "good" : "warn"}>{p.status.toLowerCase()}</Badge>
            {p.status === "ACTIVE" && (
              <Link href={`/shop/${p.slug}`} target="_blank" className={btn.secondary}>
                View in store ↗
              </Link>
            )}
            {p.status !== "ARCHIVED" && <ArchiveProductButton productId={p.id} />}
          </>
        }
      />
      <div className="space-y-6">
        <ImageManager productId={p.id} images={p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} />

        {v && (
          <Card title="Inventory">
            <StockAdjuster variantId={v.id} stock={v.stock} />
            {v.movements.length > 0 && (
              <ul className="mt-4 text-xs space-y-1 text-[var(--text-muted)]">
                {v.movements.map((m) => (
                  <li key={m.id}>
                    {m.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} · {m.delta > 0 ? `+${m.delta}` : m.delta} · {m.reason.toLowerCase().replace("_", " ")}
                    {m.note ? ` · ${m.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <div className="bg-white border border-[var(--border)] p-6">
          <ProductForm
            categories={categories}
            values={{
              id: p.id, name: p.name, slug: p.slug, categoryId: p.categoryId, status: p.status, subtitle: p.subtitle ?? "", description: p.description,
              story: p.story ?? "", collection: p.collection ?? "", fabric: p.fabric ?? "", weave: p.weave ?? "", zari: p.zari ?? "", occasion: p.occasion ?? "",
              care: p.care ?? "", colorName: p.colorName ?? "", colorHex: p.colorHex ?? "", craftTime: p.craftTime ?? "", details: p.details, motifs: p.motifs,
              tags: p.tags, isFeatured: p.isFeatured, isSignature: p.isSignature, isNewArrival: p.isNewArrival, sortRank: p.sortRank, hsnCode: p.hsnCode ?? "",
              gstPercent: p.gstRateBps != null ? String(p.gstRateBps / 100) : "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "",
              sku: v?.sku ?? "", price: rupees(v?.price), compareAtPrice: rupees(v?.compareAtPrice), unit: v?.unit ?? "PIECE", maxPerOrder: v?.maxPerOrder ?? 5,
              lowStockThreshold: v?.lowStockThreshold ?? 2, weightGrams: v?.weightGrams ?? 900,
            }}
          />
        </div>
      </div>
    </>
  );
}
