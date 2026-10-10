"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewAction } from "@/server/actions/account";
import type { ReviewDTO } from "@/server/services/content";

interface Props {
  productId: string;
  reviews: ReviewDTO[];
  rating: { average: number; count: number };
  canReview: boolean;
  signedIn: boolean;
}

const Stars = ({ value }: { value: number }) => (
  <span aria-label={`${value} out of 5 stars`} className="text-[var(--gold)] tracking-wider">
    {"★★★★★".slice(0, value)}
    <span className="text-[var(--border)]">{"★★★★★".slice(value)}</span>
  </span>
);

export default function ProductReviews({ productId, reviews, rating, canReview, signedIn }: Props) {
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [stars, setStars] = useState(5);

  return (
    <section id="reviews" className="mt-24 grid lg:grid-cols-3 gap-12" aria-labelledby="reviews-heading">
      <div>
        <h2 id="reviews-heading" className="font-serif !text-3xl text-[var(--navy)] mb-3">
          Customer reviews
        </h2>
        {rating.count > 0 ? (
          <p className="text-[var(--text-muted)]">
            <Stars value={Math.round(rating.average)} /> {rating.average} from {rating.count} verified {rating.count === 1 ? "buyer" : "buyers"}
          </p>
        ) : (
          <p className="text-[var(--text-muted)]">No reviews yet.</p>
        )}

        {canReview ? (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              start(async () => {
                const r = await submitReviewAction({ productId, rating: stars, title: fd.get("title"), body: fd.get("body") });
                setStatus(r.ok ? { ok: true, message: "Thank you! Your review will appear once our team has checked it." } : { ok: false, message: r.error });
              });
            }}
          >
            <fieldset className="flex gap-1" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" aria-label={`${n} star${n > 1 ? "s" : ""}`} aria-pressed={stars === n} onClick={() => setStars(n)} className={`text-2xl ${n <= stars ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>
                  ★
                </button>
              ))}
            </fieldset>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Title (optional)
              <input name="title" maxLength={120} className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)] text-sm normal-case tracking-normal" />
            </label>
            <label className="block text-xs uppercase tracking-widest text-[var(--text-muted)]">
              Your review
              <textarea name="body" required minLength={10} maxLength={3000} rows={4} className="mt-1 w-full px-3 py-2 bg-white border border-[var(--border)] text-sm normal-case tracking-normal" />
            </label>
            <button type="submit" disabled={pending} className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest disabled:opacity-60">
              {pending ? "Sending…" : "Submit review"}
            </button>
            {status && (
              <p role="status" className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
                {status.message}
              </p>
            )}
          </form>
        ) : (
          <p className="text-xs text-[var(--text-muted)] mt-4">
            Reviews come from customers who have received this saree.
            {!signedIn && (
              <>
                {" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>{" "}
                to review your purchases.
              </>
            )}
          </p>
        )}
      </div>

      <ul className="lg:col-span-2 space-y-6">
        {reviews.map((r) => (
          <li key={r.id} className="bg-white border border-[var(--border)] p-6">
            <div className="flex items-center justify-between gap-4">
              <Stars value={r.rating} />
              <time dateTime={r.createdAt} className="text-xs text-[var(--text-muted)]">
                {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </time>
            </div>
            {r.title && <h3 className="font-serif !text-xl text-[var(--navy)] mt-3 !mb-1">{r.title}</h3>}
            <p className="text-[var(--text-body)] mt-2">{r.body}</p>
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] !mb-0">
              {r.authorName}
              {r.isVerifiedPurchase && " · Verified purchase"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
