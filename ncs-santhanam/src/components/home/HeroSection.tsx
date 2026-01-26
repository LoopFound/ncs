"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center bg-[var(--greige)] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-[var(--ivory)]/80 via-[var(--ivory)]/40 to-transparent z-10"
                />
                <img
                    src="/images/hero/hero-main.png"
                    alt="Luxury Kanchipuram Silk Saree"
                    className="w-full h-full object-cover object-center"
                />
            </div>

            <div className="container mx-auto px-6 lg:px-12 relative z-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-xl"
                    >
                        {/* Accent Line */}
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: 40 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="h-[1px] bg-[var(--gold)] mb-8"
                        />

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] mb-4"
                        >
                            Handcrafted in Kanchipuram
                        </motion.p>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="font-[var(--font-serif)] text-5xl md:text-6xl lg:text-7xl font-light text-[var(--charcoal)] leading-[1.1] mb-6"
                        >
                            Timeless
                            <br />
                            <span className="italic">Elegance</span>
                            <br />
                            in Every Thread
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="text-base text-[var(--charcoal-light)] leading-relaxed mb-10 max-w-md"
                        >
                            Discover our exquisite collection of pure silk sarees,
                            woven with generations of craftsmanship and tradition.
                        </motion.p>

                        {/* Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.9 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link
                                href="/collections"
                                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--charcoal)] text-white text-sm tracking-[0.15em] uppercase hover:bg-black transition-all duration-300 hover:-translate-y-0.5"
                            >
                                Explore Collection
                            </Link>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center px-8 py-4 border border-[var(--charcoal)] text-[var(--charcoal)] text-sm tracking-[0.15em] uppercase hover:bg-[var(--charcoal)] hover:text-white transition-all duration-300"
                            >
                                Shop Now
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Hero Image Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="hidden lg:block relative"
                    >
                        <div className="aspect-[3/4] bg-[var(--border)] relative overflow-hidden">
                            {/* Placeholder gradient - replace with actual product image */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 to-[var(--bronze)]/20" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[var(--charcoal-muted)] text-sm tracking-widest uppercase">
                                    Hero Image
                                </span>
                            </div>
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-[var(--gold)]/30" />
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center"
            >
                <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--charcoal-muted)] mb-3">
                    Scroll
                </span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-[1px] h-8 bg-[var(--charcoal-muted)]"
                />
            </motion.div>
        </section>
    );
}
