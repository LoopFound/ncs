"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle newsletter signup
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
        setEmail("");
    };

    return (
        <section className="py-24 lg:py-32 bg-[var(--navy)] relative overflow-hidden">
            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--gold)] to-[var(--navy)] opacity-30" />

            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    {/* Icon */}
                    <div className="w-12 h-12 mx-auto mb-8 border border-[var(--gold)]/30 rounded-full flex items-center justify-center">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--gold)"
                            strokeWidth="1.5"
                        >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h2 className="font-[var(--font-serif)] text-3xl md:text-4xl font-extrabold text-[#E8B931] mb-4">
                        Join Our World
                    </h2>

                    {/* Description */}
                    <p className="text-[#E8B931] font-extrabold mb-8 max-w-md mx-auto">
                        Be the first to discover new collections, exclusive offers,
                        and stories from the world of handcrafted silk.
                    </p>

                    {/* Incentive */}
                    <p className="text-[#E8B931] text-sm tracking-wider uppercase mb-8 font-extrabold">
                        Get 10% off your first order
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="flex-1 bg-transparent border border-[#E8B931]/50 px-6 py-4 text-[#E8B931] font-extrabold text-sm placeholder:text-[#E8B931]/70 focus:outline-none focus:border-[var(--gold)] transition-colors"
                        />
                        <button
                            type="submit"
                            className="px-8 py-4 bg-[var(--gold)] text-[var(--navy)] text-sm tracking-[0.15em] uppercase hover:bg-white hover:text-[var(--gold)] transition-colors font-extrabold border border-[var(--gold)]"
                        >
                            {isSubmitted ? "Subscribed!" : "Subscribe"}
                        </button>
                    </form>

                    {/* Trust note */}
                    <p className="text-[#E8B931] font-extrabold text-xs mt-6">
                        We respect your privacy. Unsubscribe anytime.
                    </p>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-8 lg:gap-12 mt-16 pt-16 border-t border-[#E8B931]/10"
                >
                    <div className="flex items-center gap-3 text-[#E8B931] font-extrabold hover:text-[var(--gold)] transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-extrabold">Secure Payments</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#E8B931] font-extrabold hover:text-[var(--gold)] transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-extrabold">Authentic Silk</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#E8B931] font-extrabold hover:text-[var(--gold)] transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-extrabold">Free Shipping*</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#E8B931] font-extrabold hover:text-[var(--gold)] transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                        <span className="text-xs tracking-wider uppercase font-extrabold">Easy Returns</span>
                    </div>
                </motion.div>
            </div>
            {/* Background Texture - simple CSS overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-black/5" />
        </section>
    );
}
