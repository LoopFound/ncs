"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function BrandStorySection() {
    return (
        <section className="py-24 lg:py-32 bg-[var(--cream)]">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] bg-[var(--white)] relative overflow-hidden border border-[var(--grey-light)]">
                            {/* Heritage Image */}
                            <img
                                src="/images/collections/kanchipuram.png"
                                alt="Heritage Handloom"
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </div>

                        {/* Decorative frame */}
                        <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 w-full h-full border border-[var(--gold)]/30 pointer-events-none" />

                        {/* Year badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="absolute -bottom-6 -left-6 lg:-bottom-8 lg:-left-8 w-28 h-28 lg:w-36 lg:h-36 bg-[var(--navy)] flex flex-col items-center justify-center shadow-xl"
                        >
                            <span className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase mb-1">Since</span>
                            <span className="font-[var(--font-serif)] text-3xl lg:text-4xl text-white">1975</span>
                        </motion.div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="lg:pl-8"
                    >
                        {/* Accent */}
                        <div className="w-10 h-[2px] bg-[var(--gold)] mb-8" />

                        {/* Subtitle */}
                        <p className="text-xs tracking-[0.3em] uppercase text-[var(--maroon)] mb-4 font-medium">
                            Our Heritage
                        </p>

                        {/* Title */}
                        <h2 className="font-[var(--font-serif)] text-4xl md:text-5xl font-light text-[var(--navy)] mb-6 leading-tight">
                            Crafted with Care.
                            <br />
                            <span className="italic text-[var(--gold)]">Rooted in Tradition.</span>
                        </h2>

                        {/* Description */}
                        <div className="space-y-4 mb-8">
                            <p className="text-[var(--text-body)] leading-relaxed">
                                For nearly five decades, NCS Santhanam has been weaving stories of elegance
                                in the heart of Kanchipuram. Our journey began with a simple belief:
                                that true luxury lies in the perfection of craft.
                            </p>
                            <p className="text-[var(--text-body)] leading-relaxed">
                                Each saree that leaves our loom carries the legacy of generations—the
                                delicate art passed down from master to apprentice, the careful selection
                                of the finest silk, and the patience of artisans who see their work as worship.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-10 py-8 border-t border-b border-[var(--border)]">
                            <div className="text-center">
                                <span className="font-[var(--font-serif)] text-3xl lg:text-4xl text-[var(--navy)] block mb-1">50+</span>
                                <span className="text-xs tracking-wider uppercase text-[var(--text-muted)]">Years</span>
                            </div>
                            <div className="text-center">
                                <span className="font-[var(--font-serif)] text-3xl lg:text-4xl text-[var(--navy)] block mb-1">100+</span>
                                <span className="text-xs tracking-wider uppercase text-[var(--text-muted)]">Artisans</span>
                            </div>
                            <div className="text-center">
                                <span className="font-[var(--font-serif)] text-3xl lg:text-4xl text-[var(--navy)] block mb-1">25K+</span>
                                <span className="text-xs tracking-wider uppercase text-[var(--text-muted)]">Sarees</span>
                            </div>
                        </div>

                        {/* CTA */}
                        <Link
                            href="/about"
                            className="inline-flex items-center gap-3 text-sm tracking-[0.15em] uppercase text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300 group font-medium"
                        >
                            Discover Our Story
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
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
