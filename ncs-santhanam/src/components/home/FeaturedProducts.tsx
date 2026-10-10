"use client";

import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import type { ProductCard } from "@/server/services/catalog";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default function FeaturedProducts({ products }: { products: ProductCard[] }) {
  return (
    <section className="py-24 lg:py-32 bg-[var(--cream)]" aria-labelledby="featured-heading">
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 lg:mb-16"
        >
          <div>
            <div className="w-10 h-[2px] bg-[var(--gold)] mb-6" />
            <h2 id="featured-heading" className="font-serif text-4xl md:text-5xl font-light text-[var(--navy)] mb-3">
              Featured Pieces
            </h2>
            <p className="text-[var(--text-muted)] max-w-md">Handpicked selections from our most cherished collections.</p>
          </div>
          <Link href="/shop" className="hidden md:inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors duration-300">
            View All <Arrow />
          </Link>
        </motion.div>

        <motion.ul
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {products.map((product) => (
            <motion.li key={product.id} variants={itemVariants}>
              <Link href={`/shop/${product.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--white)] mb-4 border border-[var(--grey-light)]">
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.imageAlt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  )}
                  <div className="absolute inset-0 bg-[var(--navy)]/0 group-hover:bg-[var(--navy)]/20 transition-colors duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs tracking-[0.2em] uppercase px-6 py-3 border border-white/50 transition-opacity duration-300">
                      View Details
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] !mb-2">{product.categoryName}</p>
                  <h3 className="font-serif !text-lg text-[var(--navy)] mb-2 group-hover:text-[var(--gold-text)] transition-colors duration-300">{product.name}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-[var(--navy)] font-medium">{formatINR(product.price)}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-[var(--text-muted)] line-through">{formatINR(product.compareAtPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ul>

        <div className="text-center mt-10 md:hidden">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--gold-text)] transition-colors duration-300">
            View All Products <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
