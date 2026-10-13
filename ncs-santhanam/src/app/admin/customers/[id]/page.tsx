import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { isPlaceholderEmail } from "@/server/auth";
import { formatINR } from "@/lib/money";
import { statusLabel } from "@/lib/order-status";
import { PageHeader, Card, Table, td, Badge } from "@/components/admin/ui";
import CustomerAdminControls from "@/components/admin/CustomerAdminControls";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requireStaff();
  const u = await db.user.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 50 }, addresses: true, accounts: { select: { providerId: true } } },
  });
  if (!u) notFound();
  const lifetime = u.orders.filter((o) => o.paymentStatus === "PAID").reduce((a, o) => a + o.grandTotal, 0);

  return (
    <>
      <PageHeader title={u.name} description={`Customer since ${u.createdAt.toLocaleDateString("en-IN")}`} actions={u.banned ? <Badge tone="bad">Banned</Badge> : undefined} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Table head={["Order", "Date", "Status", "Total"]} empty={u.orders.length ? undefined : "No orders yet."}>
            {u.orders.map((o) => (
              <tr key={o.id}>
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                    {o.number}
                  </Link>
                </td>
                <td className={td}>{o.createdAt.toLocaleDateString("en-IN")}</td>
                <td className={td}>{statusLabel(o.status)}</td>
                <td className={td}>{formatINR(o.grandTotal)}</td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="space-y-6">
          <Card title="Contact">
            <p className="text-sm !mb-1">{isPlaceholderEmail(u.email) ? "No email" : u.email} {u.emailVerified ? "(verified)" : ""}</p>
            <p className="text-sm !mb-1">{u.phoneNumber ?? "No mobile"} {u.phoneNumberVerified ? "(verified)" : ""}</p>
            <p className="text-xs text-[var(--text-muted)] !mb-0">Sign-in: {u.accounts.map((a) => a.providerId).join(", ") || "phone OTP"}</p>
            <p className="text-sm mt-3 !mb-0">Lifetime paid: <strong>{formatINR(lifetime)}</strong></p>
          </Card>
          {u.addresses.length > 0 && (
            <Card title="Addresses">
              {u.addresses.map((a) => (
                <p key={a.id} className="text-xs !mb-2">
                  {a.fullName}, {a.line1}, {a.city}, {a.state} – {a.pincode}
                </p>
              ))}
            </Card>
          )}
          {actor.role === "admin" && actor.id !== u.id && <CustomerAdminControls userId={u.id} role={u.role as "user" | "staff" | "admin"} banned={Boolean(u.banned)} />}
        </div>
      </div>
    </>
  );
}
