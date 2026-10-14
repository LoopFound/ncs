import { db } from "@/server/db";
import { PageHeader, Stat, Table, td, Badge, btn } from "@/components/admin/ui";

export const metadata = { title: "Newsletter" };

export default async function NewsletterPage() {
  const [counts, recent] = await Promise.all([
    db.newsletterSubscriber.groupBy({ by: ["status"], _count: true }),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const n = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="The Silk Circle"
        description="Double opt-in newsletter list. Only confirmed subscribers are exported."
        actions={
          <form action="/api/admin/newsletter/export" method="get">
            <button type="submit" className={btn.primary}>
              Export confirmed (CSV)
            </button>
          </form>
        }
      />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Confirmed" value={n("CONFIRMED")} />
        <Stat label="Awaiting confirmation" value={n("PENDING")} />
        <Stat label="Unsubscribed" value={n("UNSUBSCRIBED")} />
      </div>
      <Table head={["Email", "Status", "Joined"]} empty={recent.length ? undefined : "No subscribers yet."}>
        {recent.map((s) => (
          <tr key={s.id}>
            <td className={td}>{s.email}</td>
            <td className={td}>
              <Badge tone={s.status === "CONFIRMED" ? "good" : s.status === "PENDING" ? "warn" : "neutral"}>{s.status.toLowerCase()}</Badge>
            </td>
            <td className={td}>{s.createdAt.toLocaleDateString("en-IN")}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
