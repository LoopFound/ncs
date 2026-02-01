"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center bg-[var(--cream)] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                <div
                    className="absolute inset-0 bg-gradient-to-r from-[var(--cream)]/90 via-[var(--cream)]/50 to-transparent z-10"
                />
                <img
                    src="/images/hero/hero-model.png"
                    alt="Luxury Kanchipuram Silk Saree"
                    className="w-full h-full object-cover object-center scale-110 blur-sm brightness-75"
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
                            animate={{ width: 60 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="h-[2px] bg-[var(--maroon)] mb-8"
                        />

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="text-xs tracking-[0.3em] uppercase text-[var(--maroon)] mb-4 font-medium"
                        >
                            Handcrafted in Kanchipuram
                        </motion.p>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="font-[var(--font-serif)] text-5xl md:text-6xl lg:text-7xl font-light text-[var(--navy)] leading-[1.1] mb-6"
                        >
                            Timeless
                            <br />
                            <span className="italic text-[var(--gold)]">Elegance</span>
                            <br />
                            in Every Thread
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.7 }}
                            className="text-base text-[var(--text-body)] leading-relaxed mb-10 max-w-md"
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
                                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--gold)] text-[var(--navy)] text-sm tracking-[0.15em] uppercase hover:bg-[var(--navy)] hover:text-white transition-all duration-300 hover:-translate-y-0.5 shadow-lg shadow-[var(--gold)]/20 font-bold"
                            >
                                Explore Collection
                            </Link>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center px-8 py-4 border border-[var(--navy)] text-[var(--navy)] text-sm tracking-[0.15em] uppercase hover:bg-[var(--navy)] hover:text-white transition-all duration-300"
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
                        <div className="aspect-[3/4] bg-[var(--cream)] relative overflow-hidden border border-[var(--gray-light)] shadow-2xl group">
                            <img
                                src="/images/hero/hero-model.png"
                                alt="Featured Kanchipuram Collection"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 to-[var(--maroon)]/10 mix-blend-overlay pointer-events-none" />
                        </div>

                        {/* Decorative element */}
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 border border-[var(--gold)]/40" />
                        <div className="absolute -top-6 -right-6 w-32 h-32 border border-[var(--maroon)]/20" />
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
                <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--navy)]/60 mb-3">
                    Scroll
                </span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-[1px] h-8 bg-[var(--navy)]/40"
                />
            </motion.div>
        </section>
    );
}
