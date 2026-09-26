"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const heroEdits = [
  {
    tag: "Royal Muhurtham Edit",
    title: "The Kanchipuram Brocade",
    desc: "Woven with double-warp mulberry silk & authentic tested gold zari.",
    image: "/images/hero/hero-main.png",
    accent: "Violet & Gold",
  },
  {
    tag: "Bridal Crimson Heritage",
    title: "Samudrika Bridal Pattu",
    desc: "Auspicious red silk embellished with intricate temple architecture motifs.",
    image: "/images/hero/hero-model.png",
    accent: "Auspicious Crimson",
  }
];

export default function HeroSection() {
  const [activeEditIndex, setActiveEditIndex] = useState(0);
  const activeEdit = heroEdits[activeEditIndex];

  return (
    <section className="relative min-h-[780px] lg:min-h-screen overflow-hidden bg-[#071333] text-white flex items-center">
      {/* Background Lighting & Silk Weave Ambiance */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-32 top-20 h-[38rem] w-[38rem] rounded-full bg-[#8B1E2D]/25 blur-[130px]" />
        <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-[#C9A227]/15 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 w-full mx-auto max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 min-h-[780px] lg:min-h-screen items-center">
        {/* Left Column: Brand Story & CTAs (Span 6) */}
        <div className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 pt-32 pb-16 lg:py-28">
          {/* Heritage Crest */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3.5 mb-6"
          >
            <span className="h-px w-10 bg-[#D4AF37]" />
            <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-[#D4AF37]">
              Kanchipuram • Est. 1975 • Silk Mark Certified
            </span>
          </motion.div>

          {/* Grand Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <h1 className="font-[var(--font-serif)] text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-normal leading-[1.04] tracking-tight text-[#FAF7F0]">
              Sacred Weaves, <br />
              <span className="italic text-[#E5C158] font-light">Timeless Heirlooms.</span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="text-base sm:text-lg text-white/75 font-light leading-relaxed max-w-xl mb-10 border-l border-[#D4AF37]/40 pl-5"
          >
            Rooted in the temple town of Kanchipuram, each NCS Santhanam saree is meticulously handwoven from pure mulberry silk and authentic zari—crafted to be passed down through generations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-wrap items-center gap-4 mb-12"
          >
            <Link
              href="/wedding"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#08153A] px-8 py-4 text-xs font-bold uppercase tracking-[0.22em] hover:from-[#E5C158] hover:to-[#FFF0B8] transition-all duration-300 shadow-xl shadow-amber-950/20"
            >
              <span>Explore Wedding Silks</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href="/collections"
              className="inline-flex items-center gap-3 border border-white/25 hover:border-[#D4AF37] px-7 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-white hover:text-[#D4AF37] transition-all duration-300 backdrop-blur-xs bg-white/[0.02]"
            >
              <span>Browse All Collections</span>
            </Link>
          </motion.div>

          {/* Trust Anchors Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-6 pt-6 border-t border-white/15 max-w-lg"
          >
            <div>
              <div className="font-[var(--font-serif)] text-2xl sm:text-3xl text-[#FAF7F0]">50+ Years</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Loom Mastery</div>
            </div>
            <div>
              <div className="font-[var(--font-serif)] text-2xl sm:text-3xl text-[#FAF7F0]">100% Pure</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Silk & Real Zari</div>
            </div>
            <div>
              <div className="font-[var(--font-serif)] text-2xl sm:text-3xl text-[#FAF7F0]">10,000+</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50 mt-1">Brides Adorned</div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Visual Draping Showcase (Span 6) */}
        <div className="lg:col-span-6 relative h-[580px] lg:h-screen w-full flex items-center justify-center p-6 sm:p-12 lg:p-16">
          <div className="relative w-full h-full max-h-[820px] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
            {/* Active Image */}
            <Image
              key={activeEdit.image}
              src={activeEdit.image}
              alt={activeEdit.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[50%_35%] transition-all duration-1000"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#071333] via-transparent to-transparent opacity-80 lg:opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#071333]/40 via-transparent to-transparent hidden lg:block" />

            {/* Floating Luxury Showcase Card */}
            <div className="absolute bottom-6 left-6 right-6 p-6 rounded-lg bg-[#08153A]/90 backdrop-blur-md border border-[#D4AF37]/30 text-white shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                      {activeEdit.tag}
                    </span>
                  </div>
                  <h3 className="font-[var(--font-serif)] text-xl sm:text-2xl text-[#FAF7F0] mt-1 font-normal">
                    {activeEdit.title}
                  </h3>
                  <p className="text-xs text-white/70 font-light mt-1 max-w-sm">
                    {activeEdit.desc}
                  </p>
                </div>

                {/* Edit Switcher Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {heroEdits.map((item, idx) => (
                    <button
                      key={item.title}
                      onClick={() => setActiveEditIndex(idx)}
                      className={`px-3 py-1.5 text-[10px] tracking-wider uppercase rounded transition-all ${
                        activeEditIndex === idx
                          ? "bg-[#D4AF37] text-[#08153A] font-bold shadow"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      Look 0{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
