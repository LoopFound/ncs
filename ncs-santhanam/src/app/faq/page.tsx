"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    category: "Authenticity & Silk Mark",
    questions: [
      {
        q: "How do I know the saree is authentic pure silk?",
        a: "Every pure silk saree from NCS Santhanam comes with an authentic Silk Mark tag certified by the Central Silk Board, Ministry of Textiles, Government of India. You can verify the unique hologram and QR code on the Silk Mark website.",
      },
      {
        q: "What is the difference between Pure Zari and Tested Zari?",
        a: "Pure Zari is spun from authentic silver thread plated with 24-karat gold, creating a regal heirloom weight and eternal lustre. Tested Zari utilizes copper electroplated with gold/silver tone, offering beautiful traditional brilliance at a more accessible investment level.",
      },
      {
        q: "What is a Korvai weave?",
        a: "Korvai is the ancient hallmark technique of Kanchipuram where the contrasting border and pallu are woven separately and interlocking-jointed into the body by two weavers working in synchronization on opposite sides of the pit loom.",
      },
    ],
  },
  {
    category: "Care & Preservation",
    questions: [
      {
        q: "How should I store my pure Kanchipuram silk saree?",
        a: "Always store your silk saree wrapped in breathable pure white cotton or muslin fabric. Never store them in sealed plastic bags or polythene covers, as silk is a natural protein fibre that needs to breathe. Air your sarees in mild indirect shade once every 3 to 4 months, and gently change the fold lines to protect the zari weave.",
      },
      {
        q: "Can I wash my silk saree at home?",
        a: "We strictly recommend professional dry cleaning for all handloom silk sarees, especially those featuring pure zari, contrast borders, or heavy bridal brocades.",
      },
      {
        q: "How do I iron a pure silk saree?",
        a: "Always iron on the reverse side of the saree using a low silk setting, preferably placing a soft, clean cotton handkerchief or press-cloth between the iron and the saree.",
      },
    ],
  },
  {
    category: "Orders & Showroom Services",
    questions: [
      {
        q: "Do you offer Fall, Pico, and Blouse Stitching services?",
        a: "Yes! Complimentary fall and edge-pico can be requested during checkout. If you need bespoke bridal blouse stitching or custom tassels (kuchu), you can coordinate directly with our master tailors via WhatsApp concierge.",
      },
      {
        q: "Can I schedule a live video shopping consultation?",
        a: "Yes. Our boutique offers personalized 1-on-1 WhatsApp video shopping appointments with our senior silk drapers. You can examine colors in natural daylight, inspect pallu details, and compare weaves.",
      },
      {
        q: "Can I visit your physical showroom in Kanchipuram?",
        a: "We welcome you warmly to our flagship showroom located at 59, Viladadikoil Street, Kancheepuram, Tamil Nadu (Open Monday to Saturday from 10:00 AM to 8:00 PM, Sunday 10:00 AM to 2:00 PM).",
      },
    ],
  },
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({
    "0-0": true,
    "1-0": true,
  });

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        {/* Breadcrumb */}
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Care Guide & FAQs</span>
        </div>

        <div className="mb-12 border-b border-[var(--border)] pb-8 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
            Heritage & Knowledge
          </span>
          <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
            Care Guide & Frequently Asked Questions
          </h1>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Everything you need to know about caring for your Kanchipuram heirlooms, verifying Silk Mark authenticity, and bespoke concierge services.
          </p>
        </div>

        {/* FAQ Groups */}
        <div className="space-y-12">
          {faqs.map((group, groupIdx) => (
            <div key={group.category} className="space-y-4">
              <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] border-b border-[var(--gold)]/30 pb-2">
                {group.category}
              </h2>

              <div className="space-y-3">
                {group.questions.map((faq, faqIdx) => {
                  const itemKey = `${groupIdx}-${faqIdx}`;
                  const isOpen = !!openItems[itemKey];

                  return (
                    <div
                      key={faq.q}
                      className="bg-white rounded-xl border border-[var(--border)] overflow-hidden transition-shadow shadow-xs hover:shadow-sm"
                    >
                      <button
                        onClick={() => toggleItem(itemKey)}
                        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-medium text-[var(--navy)] text-base"
                      >
                        <span className="font-[var(--font-serif)] text-lg">{faq.q}</span>
                        <span className={`w-6 h-6 rounded-full bg-[var(--cream)] flex items-center justify-center text-xs transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}>
                          ↓
                        </span>
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="px-6 pb-6 text-sm text-[var(--text-body)]/85 leading-relaxed border-t border-[var(--cream)]"
                          >
                            <p className="pt-4">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Concierge Help Box */}
        <div className="mt-16 p-8 rounded-xl bg-[var(--navy)] text-white text-center">
          <h3 className="font-[var(--font-serif)] text-2xl mb-2 text-[#FAF7F0]">
            Have a Specific Question About a Weave?
          </h3>
          <p className="text-sm text-white/70 max-w-lg mx-auto mb-6">
            Our master drapers and silk curators in Kanchipuram are always available to assist with draping advice, wedding color matching, and custom queries.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#D4AF37] text-[#08153A] font-bold text-xs uppercase tracking-widest rounded hover:bg-white transition-colors"
            >
              WhatsApp Concierge
            </a>
            <Link
              href="/contact"
              className="px-6 py-3 border border-white/20 text-white font-medium text-xs uppercase tracking-widest rounded hover:bg-white/10 transition-colors"
            >
              Showroom Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
