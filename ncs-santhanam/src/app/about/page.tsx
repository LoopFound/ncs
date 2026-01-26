"use client";

import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <div className="pt-24 lg:pt-32 pb-24">
            {/* Hero Section */}
            <section className="container mx-auto px-6 lg:px-12 mb-20 lg:mb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-4">
                        Our Heritage
                    </span>
                    <h1 className="font-[var(--font-serif)] text-5xl md:text-6xl lg:text-7xl font-light text-[var(--charcoal)] mb-8">
                        Weaving Stories for Generations
                    </h1>
                    <p className="text-lg text-[var(--charcoal-light)] leading-relaxed max-w-2xl mx-auto">
                        Since 1975, NCS Santhanam has stood as a guardian of Kanchipuram's rich weaving legacy, transforming pure silk threads into heirlooms.
                    </p>
                </motion.div>
            </section>

            {/* Image Section */}
            <section className="container mx-auto px-6 lg:px-12 mb-24 lg:mb-32">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                    className="aspect-[16/9] bg-[var(--greige)] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/10 to-[var(--bronze)]/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[var(--charcoal-muted)] text-sm tracking-widest uppercase">
                            Brand Heritage Image
                        </span>
                    </div>
                </motion.div>
            </section>

            {/* Values Grid */}
            <section className="container mx-auto px-6 lg:px-12 mb-24 lg:mb-32">
                <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
                    <div className="text-center">
                        <h3 className="font-[var(--font-serif)] text-3xl text-[var(--charcoal)] mb-4">Purity</h3>
                        <p className="text-[var(--charcoal-light)] leading-relaxed">
                            We use only the finest mulberry silk and pure zari, certified for authenticity. Our commitment to quality is unwavering.
                        </p>
                    </div>
                    <div className="text-center">
                        <h3 className="font-[var(--font-serif)] text-3xl text-[var(--charcoal)] mb-4">Craftsmanship</h3>
                        <p className="text-[var(--charcoal-light)] leading-relaxed">
                            Each saree is a labor of love, handwoven by master artisans who have inherited the skill from their forefathers.
                        </p>
                    </div>
                    <div className="text-center">
                        <h3 className="font-[var(--font-serif)] text-3xl text-[var(--charcoal)] mb-4">Tradition</h3>
                        <p className="text-[var(--charcoal-light)] leading-relaxed">
                            While we embrace contemporary designs, our heart beats for the classic motifs and techniques that define Kanchipuram.
                        </p>
                    </div>
                </div>
            </section>

            {/* Timeline Section */}
            <section className="bg-[var(--greige)] py-24 lg:py-32">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="max-w-3xl mx-auto">
                        <div className="border-l border-[var(--gold)] pl-8 lg:pl-12 space-y-16">
                            <div className="relative">
                                <span className="absolute -left-[41px] lg:-left-[57px] top-2 w-4 h-4 rounded-full bg-[var(--gold)] border-4 border-[var(--greige)]" />
                                <span className="text-sm font-bold text-[var(--gold)] block mb-2">1975</span>
                                <h3 className="font-[var(--font-serif)] text-2xl text-[var(--charcoal)] mb-4">The Beginning</h3>
                                <p className="text-[var(--charcoal-light)]">Founded by N.C. Santhanam with a single loom and a vision to bring quality silk to the community.</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[41px] lg:-left-[57px] top-2 w-4 h-4 rounded-full bg-[var(--gold)] border-4 border-[var(--greige)]" />
                                <span className="text-sm font-bold text-[var(--gold)] block mb-2">1995</span>
                                <h3 className="font-[var(--font-serif)] text-2xl text-[var(--charcoal)] mb-4">Expanding Horizons</h3>
                                <p className="text-[var(--charcoal-light)]">Expanded to a larger showroom in Kanchipuram, becoming a trusted name for wedding silks.</p>
                            </div>
                            <div className="relative">
                                <span className="absolute -left-[41px] lg:-left-[57px] top-2 w-4 h-4 rounded-full bg-[var(--gold)] border-4 border-[var(--greige)]" />
                                <span className="text-sm font-bold text-[var(--gold)] block mb-2">Present Day</span>
                                <h3 className="font-[var(--font-serif)] text-2xl text-[var(--charcoal)] mb-4">A Global Legacy</h3>
                                <p className="text-[var(--charcoal-light)]">Serving customers worldwide through our online boutique while maintaining our roots in tradition.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
