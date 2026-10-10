import { db } from "@/server/db";
import { env } from "@/server/env";
import { getCurrentUser, isStaff } from "@/server/session";
import { audit } from "@/server/audit";

export const dynamic = "force-dynamic";

/** Neutralises spreadsheet formula injection and quotes CSV fields. */
const csv = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;

export async function GET() {
  const user = await getCurrentUser();
  if (!isStaff(user)) return new Response("Forbidden", { status: 403 });
  const subs = await db.newsletterSubscriber.findMany({ where: { status: "CONFIRMED" }, orderBy: { confirmedAt: "asc" } });
  const base = env().APP_URL;
  const rows = [
    ["email", "confirmed_at", "unsubscribe_url"].join(","),
    ...subs.map((s) => [csv(s.email), csv(s.confirmedAt?.toISOString() ?? ""), csv(`${base}/newsletter/confirm?token=${s.token}&action=unsubscribe`)].join(",")),
  ];
  await audit(user!.id, "newsletter.export", "newsletter", null, { count: subs.length });
  return new Response(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="silk-circle-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
