import Link from "next/link";
import { db } from "@/server/db";
import { PageHeader, Badge } from "@/components/admin/ui";
import MessageStatusButtons from "@/components/admin/MessageStatusButtons";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const s = status === "READ" || status === "ARCHIVED" ? status : "NEW";
  const messages = await db.contactMessage.findMany({ where: { status: s }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <>
      <PageHeader title="Messages" description="Enquiries from the contact form." />
      <div className="flex gap-2 mb-6 text-xs">
        {(["NEW", "READ", "ARCHIVED"] as const).map((x) => (
          <Link key={x} href={`/admin/messages?status=${x}`} className={`px-3 py-1.5 border ${s === x ? "bg-[var(--navy)] text-white" : "bg-white"}`}>
            {x.toLowerCase()}
          </Link>
        ))}
      </div>
      {messages.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No messages.</p>
      ) : (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="bg-white border border-[var(--border)] p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-semibold !mb-0">{m.subject}</p>
                <Badge>{m.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</Badge>
              </div>
              <p className="text-sm text-[var(--text-muted)] !mb-2">
                {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="underline">{m.email}</a>
                {m.phone && ` · ${m.phone}`}
              </p>
              <p className="text-sm whitespace-pre-line">{m.message}</p>
              <MessageStatusButtons id={m.id} status={m.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
