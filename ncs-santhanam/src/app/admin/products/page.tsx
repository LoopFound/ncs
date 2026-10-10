import Link from "next/link";
import { db, type Prisma } from "@/server/db";
import { formatINR } from "@/lib/money";
import { PageHeader, Table, td, Badge, Pagination, btn } from "@/components/admin/ui";

export const metadata = { title: "Products" };
const PAGE_SIZE = 40;

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const status = ["DRAFT", "ACTIVE", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as "DRAFT" | "ACTIVE" | "ARCHIVED") : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : { status: { not: "ARCHIVED" } }),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}),
  };
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: { orderBy: { createdAt: "asc" }, take: 1 },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} products`}
        actions={
          <Link href="/admin/products/new" className={btn.primary}>
            + New product
          </Link>
        }
      />
      <form method="get" className="flex flex-wrap gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, slug or SKU" className="flex-1 max-w-md px-3 py-2 border border-[var(--border)] bg-white text-sm" />
        <select name="status" defaultValue={status ?? ""} className="px-3 py-2 border border-[var(--border)] bg-white text-sm">
          <option value="">Active & drafts</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Drafts</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <button className="px-4 py-2 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">Filter</button>
      </form>
      <Table head={["", "Product", "Category", "Price", "Stock", "Status", "Flags"]} empty={products.length ? undefined : "No products found."}>
        {products.map((p) => {
          const v = p.variants[0];
          return (
            <tr key={p.id} className="hover:bg-[var(--cream)]/50">
              <td className={`${td} w-14`}>
                <div className="w-10 h-12 bg-[var(--greige)] overflow-hidden">{p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}</div>
              </td>
              <td className={td}>
                <Link href={`/admin/products/${p.id}`} className="font-semibold text-[var(--navy)] hover:underline">
                  {p.name}
                </Link>
                <div className="text-xs text-[var(--text-muted)]">{v?.sku}</div>
              </td>
              <td className={td}>{p.category.name}</td>
              <td className={td}>{v ? formatINR(v.price) : "—"}</td>
              <td className={td}>
                {v ? <Badge tone={v.stock === 0 ? "bad" : v.stock <= v.lowStockThreshold ? "warn" : "good"}>{v.stock}</Badge> : "—"}
              </td>
              <td className={td}>
                <Badge tone={p.status === "ACTIVE" ? "good" : p.status === "DRAFT" ? "warn" : "neutral"}>{p.status.toLowerCase()}</Badge>
              </td>
              <td className={`${td} text-xs`}>{[p.isFeatured && "Featured", p.isSignature && "Carousel", p.isNewArrival && "New"].filter(Boolean).join(", ")}</td>
            </tr>
          );
        })}
      </Table>
      <Pagination
        page={page}
        pageCount={Math.ceil(total / PAGE_SIZE)}
        href={(n) => `/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(n) })}`}
      />
    </>
  );
}
