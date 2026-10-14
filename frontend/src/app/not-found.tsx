"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center pt-28 pb-20 px-6">
      <div className="max-w-2xl w-full text-center">
        {/* Decorative Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white border border-[var(--gold)]/30 text-[var(--gold-text)] text-[11px] uppercase tracking-[0.25em] mb-6 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
          404 • Page Not Found
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-[var(--font-serif)] text-5xl sm:text-6xl md:text-7xl text-[var(--navy)] leading-tight mb-6"
        >
          A Thread Lost in <br />
          <span className="italic text-[var(--gold-text)] font-normal">the Loom</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base text-[var(--text-muted)] leading-relaxed max-w-lg mx-auto mb-10"
        >
          The page or curated weave you are seeking may have been moved, renamed, or is currently on our weavers&apos; looms. Allow our atelier to guide you to our finest creations.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/"
            className="px-8 py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 shadow-lg shadow-blue-950/10"
          >
            Return to Homepage
          </Link>
          <Link
            href="/shop"
            className="px-8 py-4 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[var(--navy)] hover:text-white transition-all duration-300"
          >
            Explore All Collections
          </Link>
        </motion.div>

        {/* Quick Links Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs text-left"
        >
          <h3 className="font-[var(--font-serif)] text-lg text-[var(--navy)] mb-4 text-center">
            Popular Heirlooms & Sanctuaries
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Link
              href="/wedding"
              className="p-3 rounded-lg hover:bg-[var(--cream)] text-xs uppercase tracking-wider text-[var(--navy)] font-medium transition-colors"
            >
              Wedding Silks →
            </Link>
            <Link
              href="/kanchipuram"
              className="p-3 rounded-lg hover:bg-[var(--cream)] text-xs uppercase tracking-wider text-[var(--navy)] font-medium transition-colors"
            >
              Kanchipuram →
            </Link>
            <Link
              href="/soft-silk"
              className="p-3 rounded-lg hover:bg-[var(--cream)] text-xs uppercase tracking-wider text-[var(--navy)] font-medium transition-colors"
            >
              Soft Silks →
            </Link>
            <Link
              href="/contact"
              className="p-3 rounded-lg hover:bg-[var(--cream)] text-xs uppercase tracking-wider text-[var(--navy)] font-medium transition-colors"
            >
              Concierge Help →
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
