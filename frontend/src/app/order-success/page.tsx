"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

export default function OrderSuccessPage() {
  const [orderNumber] = useState("NCS-78429");

  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)] min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-700 shadow-sm"
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </motion.div>

        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
          Order Confirmed & Secured
        </span>

        <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
          Thank You for Welcoming <br />
          <span className="italic text-[var(--gold-text)]">Our Weave</span>
        </h1>

        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
          Your order has been recorded at our Kanchipuram atelier. Our master weavers and preservation team are preparing your silk heirloom for dispatch.
        </p>

        {/* Order Details Card */}
        <div className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs text-left mb-10 space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Order Reference:</span>
            <span className="font-bold text-[var(--navy)] tracking-wider">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Estimated Delivery:</span>
            <span className="font-semibold text-emerald-700">3 – 5 Business Days</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] text-sm">
            <span className="text-[var(--text-muted)]">Courier Partner:</span>
            <span className="font-medium text-[var(--navy)]">Blue Dart Express (Air Insured)</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-muted)]">Certification Included:</span>
            <span className="font-semibold text-[var(--gold-text)]">Central Silk Board Silk Mark</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/shop"
            className="px-8 py-3.5 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors shadow-md"
          >
            Continue Exploring
          </Link>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors"
          >
            Track on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
