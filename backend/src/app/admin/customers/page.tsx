import Link from "next/link";
import { db, type Prisma } from "@/server/db";
import { isPlaceholderEmail } from "@/server/auth";
import { PageHeader, Table, td, Badge, Pagination } from "@/components/admin/ui";

export const metadata = { title: "Customers" };
const PAGE_SIZE = 40;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phoneNumber: { contains: q } }] }
    : {};
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { _count: { select: { orders: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Customers" description={`${total} accounts`} />
      <form method="get" className="flex gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Name, email or mobile" className="flex-1 max-w-md px-3 py-2 border border-[var(--border)] bg-white text-sm" />
        <button className="px-4 py-2 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">Search</button>
      </form>
      <Table head={["Name", "Email", "Mobile", "Orders", "Role", "Joined"]} empty={users.length ? undefined : "No customers found."}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className={td}>
              <Link href={`/admin/customers/${u.id}`} className="font-semibold hover:underline">
                {u.name}
              </Link>
              {u.banned && (
                <span className="ml-2">
                  <Badge tone="bad">banned</Badge>
                </span>
              )}
            </td>
            <td className={td}>
              {isPlaceholderEmail(u.email) ? "—" : u.email} {u.emailVerified && "✓"}
            </td>
            <td className={td}>
              {u.phoneNumber ?? "—"} {u.phoneNumberVerified && "✓"}
            </td>
            <td className={td}>{u._count.orders}</td>
            <td className={td}>{u.role !== "user" ? <Badge tone="info">{u.role}</Badge> : "customer"}</td>
            <td className={td}>{u.createdAt.toLocaleDateString("en-IN")}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(n) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`} />
    </>
  );
}
