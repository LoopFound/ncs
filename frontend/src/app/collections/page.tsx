"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { collections } from "@/data/mock";

export default function CollectionsPage() {
    return (
        <div className="pt-24 lg:pt-32 pb-24">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className="text-center mb-16 lg:mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="font-[var(--font-serif)] text-5xl md:text-6xl font-light text-[var(--charcoal)] mb-6"
                    >
                        Our Collections
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-[var(--charcoal-muted)] max-w-xl mx-auto"
                    >
                        Explore our diverse range of handcrafted silks, from bridal masterpieces to contemporary elegance.
                    </motion.p>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 text-center gap-8 lg:gap-12">
                    {collections.map((collection, index) => (
                        <motion.div
                            key={collection.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                            <Link href={`/shop?category=${collection.slug}`} className="group block">
                                <div className="relative aspect-[4/3] overflow-hidden mb-6 bg-[var(--greige)]">
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />

                                    {/* Image Placeholder */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10 group-hover:scale-105 transition-transform duration-700 ease-out" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[var(--charcoal-muted)] text-xs tracking-widest uppercase opacity-50">
                                            {collection.title} Image
                                        </span>
                                    </div>
                                </div>

                                <h2 className="font-[var(--font-serif)] text-3xl text-[var(--charcoal)] mb-3 group-hover:text-[var(--gold)] transition-colors">
                                    {collection.title}
                                </h2>
                                <p className="text-[var(--charcoal-light)] text-sm max-w-sm mx-auto mb-4">
                                    {collection.description}
                                </p>

                                <span className="inline-block text-xs uppercase tracking-[0.2em] text-[var(--charcoal)] border-b border-[var(--charcoal)] pb-1 group-hover:text-[var(--gold)] group-hover:border-[var(--gold)] transition-all">
                                    View Collection
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
