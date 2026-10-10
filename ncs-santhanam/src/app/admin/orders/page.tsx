import Link from "next/link";
import { db, type Prisma } from "@/server/db";
import { formatINR } from "@/lib/money";
import { statusLabel, PAYMENT_LABELS } from "@/lib/order-status";
import { PageHeader, Table, td, Badge, Pagination } from "@/components/admin/ui";

export const metadata = { title: "Orders" };

const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED", "CANCELLED"];
const PAGE_SIZE = 30;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status ?? "") ? sp.status : undefined;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status: status as Prisma.OrderWhereInput["status"] } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { user: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } }, _count: { select: { items: true } } },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const href = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { status, q: q || undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/orders${p.size ? `?${p}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${total} order${total === 1 ? "" : "s"}`} />

      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <Link href={href({ status: undefined, page: undefined })} className={`px-3 py-1.5 border ${!status ? "bg-[var(--navy)] text-white" : "bg-white"}`}>
          All
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={href({ status: s, page: undefined })} className={`px-3 py-1.5 border ${status === s ? "bg-[var(--navy)] text-white" : "bg-white"}`}>
            {statusLabel(s)} ({countFor(s)})
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Order number, email, phone or name" className="flex-1 max-w-md px-3 py-2 border border-[var(--border)] bg-white text-sm" />
        <button className="px-4 py-2 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">Search</button>
      </form>

      <Table head={["Order", "Customer", "Items", "Payment", "Status", "Total"]} empty={orders.length ? undefined : "No orders match."}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-[var(--cream)]/50">
            <td className={td}>
              <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[var(--navy)] hover:underline">
                {o.number}
              </Link>
              <div className="text-xs text-[var(--text-muted)]">{o.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
            </td>
            <td className={td}>
              {o.user.name}
              <div className="text-xs text-[var(--text-muted)]">{o.phone}</div>
            </td>
            <td className={td}>{o._count.items}</td>
            <td className={td}>
              {o.paymentMethod === "COD" ? "COD" : "Online"} · {PAYMENT_LABELS[o.paymentStatus]}
            </td>
            <td className={td}>
              <Badge tone={o.status === "CANCELLED" ? "bad" : o.status === "DELIVERED" ? "good" : o.status === "PENDING_PAYMENT" || o.status === "RETURN_REQUESTED" ? "warn" : "info"}>
                {statusLabel(o.status)}
              </Badge>
            </td>
            <td className={td}>{formatINR(o.grandTotal)}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(p) => href({ page: String(p) })} />
    </>
  );
}
