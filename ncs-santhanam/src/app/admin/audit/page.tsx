import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { PageHeader, Table, td, Pagination } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };
const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const actor = await requireStaff();
  if (actor.role !== "admin") redirect("/admin");
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [total, logs] = await Promise.all([
    db.auditLog.count(),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { actor: { select: { name: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Audit log" description="Every change made from the admin, newest first." />
      <Table head={["When", "Who", "Action", "Target", "Details"]} empty={logs.length ? undefined : "No activity yet."}>
        {logs.map((l) => (
          <tr key={l.id}>
            <td className={`${td} whitespace-nowrap`}>{l.createdAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "medium" })}</td>
            <td className={td}>{l.actor?.name ?? "system"}</td>
            <td className={`${td} font-mono text-xs`}>{l.action}</td>
            <td className={`${td} text-xs`}>
              {l.entity}
              {l.entityId ? ` · ${l.entityId.slice(0, 12)}` : ""}
            </td>
            <td className={`${td} text-xs font-mono max-w-md truncate`}>{l.data ? JSON.stringify(l.data) : ""}</td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} href={(n) => `/admin/audit?page=${n}`} />
    </>
  );
}
