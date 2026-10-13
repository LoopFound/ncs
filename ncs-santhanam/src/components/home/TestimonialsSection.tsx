"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import type { ReviewDTO } from "@/server/services/content";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

/** Real, moderated reviews from verified buyers (the section is hidden when there are none). */
export default function TestimonialsSection({ reviews }: { reviews: ReviewDTO[] }) {
  return (
    <section className="py-24 lg:py-32 bg-[var(--cream)]" aria-labelledby="reviews-home-heading">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="w-10 h-[2px] bg-[var(--gold)] mx-auto mb-6" />
          <h2 id="reviews-home-heading" className="font-serif text-4xl md:text-5xl font-light text-[var(--navy)] mb-4">
            What Our Customers Say
          </h2>
          <p className="text-[var(--text-muted)] max-w-md mx-auto">Reviews from customers who have received their weaves.</p>
        </motion.div>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-8"
        >
          {reviews.map((r) => (
            <motion.li
              key={r.id}
              variants={itemVariants}
              className="bg-[var(--white)] p-8 lg:p-10 relative border border-[var(--grey-light)] shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <div className="absolute top-6 right-6 font-serif text-6xl text-[var(--gold)]/20 leading-none" aria-hidden="true">
                &ldquo;
              </div>
              <div className="flex gap-1 mb-6 text-[var(--gold)]" aria-label={`${r.rating} out of 5 stars`}>
                {"★".repeat(r.rating)}
              </div>
              <blockquote className="text-[var(--text-body)] leading-relaxed mb-6 relative z-10 italic">&ldquo;{r.body}&rdquo;</blockquote>
              <div className="pt-6 border-t border-[var(--grey-light)]">
                <p className="font-serif !text-lg text-[var(--navy)] !mb-0">{r.authorName}</p>
                <p className="text-xs tracking-wider uppercase text-[var(--text-muted)] mt-1 !mb-0">
                  {r.isVerifiedPurchase ? "Verified purchase · " : ""}
                  <Link href={`/shop/${r.productSlug}`} className="hover:text-[var(--gold-text)]">
                    {r.productName}
                  </Link>
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
