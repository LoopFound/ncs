import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/session";
import { listOrdersForUser } from "@/server/services/orders";
import { formatINR } from "@/lib/money";
import { statusLabel, statusTone } from "@/lib/order-status";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listOrdersForUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="bg-white p-10 border border-[var(--border)] text-center">
        <h2 className="font-serif !text-2xl text-[var(--navy)] mb-3">No orders yet</h2>
        <Link href="/shop" className="inline-block mt-2 px-8 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="bg-white border border-[var(--border)] p-6">
          <Link href={`/account/orders/${o.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((i, idx) => (
                  <div key={idx} className="w-12 h-16 bg-[var(--greige)] border-2 border-white overflow-hidden">
                    {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold text-[var(--navy)] group-hover:text-[var(--gold-text)] !mb-0">{o.number}</p>
                <p className="text-xs text-[var(--text-muted)] !mb-0">
                  {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((a, i) => a + i.quantity, 0)} item(s)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-xs px-3 py-1 border rounded-full ${statusTone(o.status)}`}>{statusLabel(o.status)}</span>
              <span className="font-semibold text-[var(--navy)]">{formatINR(o.grandTotal)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
