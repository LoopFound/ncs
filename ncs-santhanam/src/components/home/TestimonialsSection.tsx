"use client";

import { motion } from "framer-motion";

const testimonials = [
    {
        id: 1,
        name: "Priya Sharma",
        location: "Chennai",
        rating: 5,
        text: "The quality of the silk is absolutely exceptional. My wedding saree from NCS Santhanam was the most beautiful piece I've ever owned. The craftsmanship is unparalleled.",
    },
    {
        id: 2,
        name: "Lakshmi Venkat",
        location: "Bangalore",
        rating: 5,
        text: "I've been buying sarees from NCS Santhanam for over a decade. Their attention to detail and customer service is what keeps me coming back.",
    },
    {
        id: 3,
        name: "Meera Krishnan",
        location: "Mumbai",
        rating: 5,
        text: "Found the perfect gift saree for my mother's 60th birthday. The packaging was elegant, and the saree exceeded all expectations.",
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
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
        },
    },
};

export default function TestimonialsSection() {
    return (
        <section className="py-24 lg:py-32 bg-[var(--greige)]">
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
                        What Our Customers Say
                    </h2>
                    <p className="text-[var(--charcoal-muted)] max-w-md mx-auto">
                        Trusted by families across generations for life's most precious moments.
                    </p>
                </motion.div>

                {/* Testimonials Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid md:grid-cols-3 gap-8"
                >
                    {testimonials.map((testimonial) => (
                        <motion.div
                            key={testimonial.id}
                            variants={itemVariants}
                            className="bg-[var(--ivory)] p-8 lg:p-10 relative"
                        >
                            {/* Quote mark */}
                            <div className="absolute top-6 right-6 font-[var(--font-serif)] text-6xl text-[var(--gold)]/20 leading-none">
                                "
                            </div>

                            {/* Stars */}
                            <div className="flex gap-1 mb-6">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <svg
                                        key={i}
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="var(--gold)"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>

                            {/* Text */}
                            <p className="text-[var(--charcoal-light)] leading-relaxed mb-6 relative z-10">
                                "{testimonial.text}"
                            </p>

                            {/* Author */}
                            <div className="pt-6 border-t border-[var(--border)]">
                                <h4 className="font-[var(--font-serif)] text-lg text-[var(--charcoal)]">
                                    {testimonial.name}
                                </h4>
                                <p className="text-xs tracking-wider uppercase text-[var(--charcoal-muted)] mt-1">
                                    {testimonial.location}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
