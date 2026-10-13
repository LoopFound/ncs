import Link from "next/link";
import { db } from "@/server/db";
import { PageHeader, Badge } from "@/components/admin/ui";
import ReviewModeration from "@/components/admin/ReviewModeration";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const s = status === "APPROVED" || status === "REJECTED" ? status : "PENDING";
  const reviews = await db.review.findMany({
    where: { status: s },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true } }, product: { select: { name: true, id: true } } },
  });

  return (
    <>
      <PageHeader title="Reviews" description="Only customers with a delivered order can review, and nothing is published until approved." />
      <div className="flex gap-2 mb-6 text-xs">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((x) => (
          <Link key={x} href={`/admin/reviews?status=${x}`} className={`px-3 py-1.5 border ${s === x ? "bg-[var(--navy)] text-white" : "bg-white"}`}>
            {x.toLowerCase()}
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nothing here.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-white border border-[var(--border)] p-5">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <span className="text-sm">
                  <span className="text-[var(--gold)]">{"★".repeat(r.rating)}</span> by <strong>{r.user.name}</strong> on{" "}
                  <Link href={`/admin/products/${r.product.id}`} className="underline">
                    {r.product.name}
                  </Link>
                </span>
                <span className="flex gap-2 items-center">
                  {r.isVerifiedPurchase && <Badge tone="good">verified purchase</Badge>}
                  <span className="text-xs text-[var(--text-muted)]">{r.createdAt.toLocaleDateString("en-IN")}</span>
                </span>
              </div>
              {r.title && <p className="font-semibold !mb-1">{r.title}</p>}
              <p className="text-sm whitespace-pre-line">{r.body}</p>
              <ReviewModeration reviewId={r.id} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
