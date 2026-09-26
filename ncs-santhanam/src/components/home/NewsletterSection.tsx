"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 4000);
        setEmail("");
    };

    return (
        <section className="py-20 lg:py-28 bg-[#09173E] text-white relative overflow-hidden border-t border-[var(--gold)]/10">
            <div className="container mx-auto px-6 lg:px-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    {/* Icon */}
                    <div className="w-12 h-12 mx-auto mb-6 border border-[#D4AF37]/30 rounded-full flex items-center justify-center text-[#D4AF37]">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </div>

                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold block mb-2">
                        The Silk Circle
                    </span>

                    {/* Title */}
                    <h2 className="font-[var(--font-serif)] text-3xl md:text-4xl text-[#FAF7F0] mb-3">
                        Join Our Exclusive Atelier
                    </h2>

                    {/* Description */}
                    <p className="text-white/70 font-light text-sm mb-6 max-w-md mx-auto leading-relaxed">
                        Be the first to preview rare wedding weaves, festive releases, and private showroom invitations from Kanchipuram.
                    </p>

                    {/* Form */}
                    {isSubmitted ? (
                        <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded max-w-md mx-auto">
                            <p className="text-sm text-emerald-300 font-medium">Thank you for joining The Silk Circle.</p>
                            <p className="text-xs text-white/60 mt-1">We respect your privacy and will never send spam.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
                            />
                            <button
                                type="submit"
                                className="px-7 py-3.5 bg-[#D4AF37] text-[#08153A] text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#F0DA84] transition-colors rounded shadow-md shrink-0"
                            >
                                Subscribe
                            </button>
                        </form>
                    )}

                    <p className="text-white/40 text-[11px] mt-4 font-light">
                        Unsubscribe anytime. We safeguard your contact details.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
