"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const collections = [
    {
        id: 1,
        title: "Wedding Silks",
        subtitle: "Bridal Collection",
        href: "/collections/wedding",
        image: "/images/collections/wedding.jpg",
    },
    {
        id: 2,
        title: "Kanchipuram Classics",
        subtitle: "Heritage Weaves",
        href: "/collections/kanchipuram",
        image: "/images/collections/kanchipuram.jpg",
    },
    {
        id: 3,
        title: "Soft Silks",
        subtitle: "Everyday Elegance",
        href: "/collections/soft-silk",
        image: "/images/collections/soft-silk.jpg",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

export default function CollectionsSection() {
    return (
        <section className="py-24 lg:py-32 bg-[var(--ivory)]">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 lg:mb-20"
                >
                    <div className="w-10 h-[1px] bg-[var(--gold)] mx-auto mb-6" />
                    <h2 className="font-[var(--font-serif)] text-4xl md:text-5xl font-light text-[var(--charcoal)] mb-4">
                        Our Collections
                    </h2>
                    <p className="text-[var(--charcoal-muted)] max-w-md mx-auto">
                        Explore our carefully curated collections, each telling a story of heritage and elegance.
                    </p>
                </motion.div>

                {/* Collections Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {collections.map((collection) => (
                        <motion.div key={collection.id} variants={itemVariants}>
                            <Link href={collection.href} className="group block">
                                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--greige)]">
                                    {/* Image placeholder - replace with actual images */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10 group-hover:scale-105 transition-transform duration-700 ease-out" />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-[var(--charcoal)]/0 group-hover:bg-[var(--charcoal)]/20 transition-colors duration-500" />

                                    {/* Content */}
                                    <div className="absolute inset-0 flex flex-col justify-end p-8">
                                        <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--charcoal-muted)] mb-2 group-hover:text-[var(--gold)] transition-colors duration-300">
                                            {collection.subtitle}
                                        </span>
                                        <h3 className="font-[var(--font-serif)] text-2xl lg:text-3xl text-[var(--charcoal)] group-hover:text-[var(--charcoal)] transition-colors duration-300">
                                            {collection.title}
                                        </h3>

                                        {/* Arrow */}
                                        <div className="mt-4 overflow-hidden">
                                            <motion.div
                                                className="flex items-center gap-2 text-sm tracking-wider uppercase text-[var(--charcoal-muted)]"
                                                initial={{ x: 0 }}
                                                whileHover={{ x: 10 }}
                                            >
                                                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    Explore
                                                </span>
                                                <svg
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    className="transform group-hover:translate-x-2 transition-transform duration-300"
                                                >
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* View All Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-center mt-12"
                >
                    <Link
                        href="/collections"
                        className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--charcoal-muted)] hover:text-[var(--gold)] transition-colors duration-300"
                    >
                        View All Collections
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
