"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-[760px] overflow-hidden bg-[#071333] text-white flex items-center lg:min-h-screen">
      {/* Kanchipuram textile backdrop inspired by the supplied border artwork. */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/images/imagehero.avif"
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="object-cover object-left opacity-75"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,19,51,0.7)_0%,rgba(7,19,51,0.82)_44%,rgba(7,19,51,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,19,51,0.08)_0%,rgba(7,19,51,0.52)_100%)]" />
        <div className="absolute right-1/4 bottom-10 h-80 w-80 rounded-full bg-[#C9A227]/15 blur-[110px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[760px] w-full max-w-[1520px] grid-cols-1 items-center gap-8 px-5 pb-12 pt-32 sm:px-10 lg:min-h-screen lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10 lg:px-12 lg:pb-8 lg:pt-28 xl:gap-16 xl:px-16">
        {/* Left Column: Brand Story & CTAs (Span 6) */}
        <div className="flex max-w-2xl flex-col justify-center">
          {/* Heritage Crest */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 flex items-center gap-3.5"
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
            className="mb-5"
          >
            <h1 className="font-[var(--font-serif)] text-5xl font-normal leading-[0.98] tracking-[-0.025em] text-[#FAF7F0] sm:text-6xl lg:text-[3.5rem] xl:text-[3.75rem] 2xl:text-[4.5rem]">
              <span className="block">Sacred Weaves,</span>
              <span className="mt-2 block font-light italic text-[#E5C158] sm:whitespace-nowrap">Timeless Heirlooms.</span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22 }}
            className="mb-8 max-w-xl border-l border-[#D4AF37]/50 pl-5 text-base font-light leading-7 text-white/78 sm:text-lg"
          >
            Rooted in the temple town of Kanchipuram, each NCS Santhanam saree is meticulously handwoven from pure mulberry silk and authentic zari—crafted to be passed down through generations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mb-10 flex flex-wrap items-center gap-4"
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
            className="grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-5 sm:gap-6"
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
        <div className="relative flex h-[520px] w-full items-center justify-center sm:h-[620px] lg:h-[68vh] lg:min-h-[420px] lg:max-h-[720px]">
          <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] border border-[#E5C158]/25 shadow-[0_32px_80px_rgba(0,0,0,0.38)]">
            {/* Active Image */}
            <Image
              src="/images/hero/hero-main.png"
              alt="Kanchipuram silk saree"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-[50%_32%] transition-transform duration-700 hover:scale-[1.015]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071333]/30 via-transparent to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
