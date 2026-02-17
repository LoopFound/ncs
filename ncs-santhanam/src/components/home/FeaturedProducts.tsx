"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const products = [
    {
        id: 1,
        name: "Royal Kanchipuram Silk",
        price: "₹45,000",
        originalPrice: "₹52,000",
        category: "Wedding Collection",
        href: "/shop/product-1",
        image: "/images/collections/Gemini_Generated_Image_a504fwa504fwa504.png",
    },
    {
        id: 2,
        name: "Classic Gold Border Pattu",
        price: "₹38,000",
        category: "Kanchipuram",
        href: "/shop/product-2",
        image: "/images/collections/Gemini_Generated_Image_bhmtv9bhmtv9bhmt.png",
    },
    {
        id: 3,
        name: "Soft Silk Pastel Dreams",
        price: "₹18,500",
        category: "Soft Silk",
        href: "/shop/product-3",
        image: "/images/collections/Gemini_Generated_Image_vdqny5vdqny5vdqn.png",
    },
    {
        id: 4,
        name: "Temple Zari Weave",
        price: "₹55,000",
        category: "Wedding Collection",
        href: "/shop/product-4",
        image: "/images/collections/Gemini_Generated_Image_vkgvmnvkgvmnvkgv.png",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
        },
    },
};

export default function FeaturedProducts() {
    return (
        <section className="py-24 lg:py-32 bg-[var(--cream)]">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 lg:mb-16"
                >
                    <div>
                        <div className="w-10 h-[2px] bg-[var(--gold)] mb-6" />
                        <h2 className="font-[var(--font-serif)] text-4xl md:text-5xl font-light text-[var(--navy)] mb-3">
                            Featured Pieces
                        </h2>
                        <p className="text-[var(--text-muted)] max-w-md">
                            Handpicked selections from our most cherished collections.
                        </p>
                    </div>
                    <Link
                        href="/shop"
                        className="hidden md:inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-300 mt-6 md:mt-0"
                    >
                        View All
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

                {/* Products Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
                >
                    {products.map((product) => (
                        <motion.div key={product.id} variants={itemVariants}>
                            <Link href={product.href} className="group block">
                                {/* Image */}
                                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--white)] mb-4 border border-[var(--grey-light)]">
                                    {/* Product Image */}
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                                    />

                                    {/* Overlay gradient for hover effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                    {/* Quick View Overlay */}
                                    <div className="absolute inset-0 bg-[var(--navy)]/0 group-hover:bg-[var(--navy)]/20 transition-colors duration-300 flex items-center justify-center">
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            whileHover={{ opacity: 1, y: 0 }}
                                            className="opacity-0 group-hover:opacity-100 text-white text-xs tracking-[0.2em] uppercase px-6 py-3 border border-white/50 transition-opacity duration-300"
                                        >
                                            View Details
                                        </motion.span>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="text-center">
                                    <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)] mb-2">
                                        {product.category}
                                    </p>
                                    <h3 className="font-[var(--font-serif)] text-lg text-[var(--navy)] mb-2 group-hover:text-[var(--gold)] transition-colors duration-300">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-sm text-[var(--navy)] font-medium">
                                            {product.price}
                                        </span>
                                        {product.originalPrice && (
                                            <span className="text-sm text-[var(--text-muted)] line-through">
                                                {product.originalPrice}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mobile View All */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="text-center mt-10 md:hidden"
                >
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 text-sm tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors duration-300"
                    >
                        View All Products
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
