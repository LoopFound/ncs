import Link from "next/link";
import { db } from "@/server/db";
import { formatINR } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { PageHeader, Stat, Card, Table, td, Badge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

const REVENUE_STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "RETURN_REQUESTED"] as const;

export default async function AdminDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = (n: number) => new Date(now.getTime() - n * 86_400_000);

  const revenue = (since: Date) =>
    db.order.aggregate({ where: { status: { in: [...REVENUE_STATUSES] }, placedAt: { gte: since } }, _sum: { grandTotal: true }, _count: true });

  const [today, week, month, toShip, awaitingPayment, returns, pendingReviews, newMessages, lowStock, recent] = await Promise.all([
    revenue(startOfDay),
    revenue(days(7)),
    revenue(days(30)),
    db.order.count({ where: { status: { in: ["CONFIRMED", "PROCESSING"] } } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
    db.order.count({ where: { status: "RETURN_REQUESTED" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.$queryRaw<{ id: string; sku: string; stock: number; name: string; productId: string }[]>`
      SELECT v.id, v.sku, v.stock, p.name, p.id AS "productId"
      FROM product_variants v JOIN products p ON p.id = v."productId"
      WHERE v."isActive" AND p.status = 'ACTIVE' AND v.stock <= v."lowStockThreshold"
      ORDER BY v.stock ASC LIMIT 10`,
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" description="Live view of sales, fulfilment and stock." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Stat label="Sales today" value={formatINR(today._sum.grandTotal ?? 0)} hint={`${today._count} orders`} />
        <Stat label="Last 7 days" value={formatINR(week._sum.grandTotal ?? 0)} hint={`${week._count} orders`} />
        <Stat label="Last 30 days" value={formatINR(month._sum.grandTotal ?? 0)} hint={`${month._count} orders`} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Link href="/admin/orders?status=CONFIRMED">
          <Stat label="To fulfil" value={toShip} />
        </Link>
        <Link href="/admin/orders?status=PENDING_PAYMENT">
          <Stat label="Awaiting payment" value={awaitingPayment} />
        </Link>
        <Link href="/admin/orders?status=RETURN_REQUESTED">
          <Stat label="Return requests" value={returns} />
        </Link>
        <Link href="/admin/reviews">
          <Stat label="Reviews to moderate" value={pendingReviews} />
        </Link>
        <Link href="/admin/messages">
          <Stat label="New messages" value={newMessages} />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-serif !text-xl text-[var(--navy)] mb-3">Recent orders</h2>
          <Table head={["Order", "Customer", "Status", "Total"]} empty={recent.length ? undefined : "No orders yet."}>
            {recent.map((o) => (
              <tr key={o.id}>
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-[var(--navy)] hover:underline">
                    {o.number}
                  </Link>
                  <div className="text-xs text-[var(--text-muted)]">{o.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                </td>
                <td className={td}>{o.user.name}</td>
                <td className={td}>
                  <Badge tone={o.status === "CANCELLED" ? "bad" : o.status === "DELIVERED" ? "good" : o.status === "PENDING_PAYMENT" ? "warn" : "info"}>
                    {statusLabel(o.status)}
                  </Badge>
                </td>
                <td className={td}>{formatINR(o.grandTotal)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <Card title="Low stock">
          {lowStock.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] !mb-0">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-2">
                  <Link href={`/admin/products/${v.productId}`} className="hover:underline truncate">
                    {v.name}
                  </Link>
                  <Badge tone={v.stock === 0 ? "bad" : "warn"}>{v.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
