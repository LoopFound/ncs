"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function NewsletterSection() {
    return (
        <section className="py-20 lg:py-28 bg-[#09173E] textile-night text-white relative overflow-hidden border-t border-[var(--gold)]/10">
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
                    <h2 className="font-serif text-3xl md:text-4xl text-[#FAF7F0] mb-3">
                        Join Our Exclusive Atelier
                    </h2>

                    {/* Description */}
                    <p className="text-white/70 font-light text-sm mb-6 max-w-md mx-auto leading-relaxed">
                        Be the first to preview rare wedding weaves, festive releases, and private showroom invitations from Kanchipuram.
                    </p>

                    {/* Sign-ups stay disabled until a subscription service is connected. */}
                    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" aria-describedby="newsletter-status">
                        <input
                            type="email"
                            disabled
                            aria-label="Email address"
                            placeholder="Enter your email address"
                            className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 rounded text-sm text-white placeholder:text-white/40 cursor-not-allowed opacity-60"
                        />
                        <button
                            type="submit"
                            disabled
                            className="px-7 py-3.5 bg-[#D4AF37] text-[#08153A] text-xs tracking-[0.2em] uppercase font-bold rounded shadow-md shrink-0 cursor-not-allowed opacity-60"
                        >
                            Coming Soon
                        </button>
                    </form>

                    <p id="newsletter-status" className="text-white/60 text-xs mt-4 font-light">
                        Sign-ups open soon. For showroom invitations, please{" "}
                        <Link href="/contact" className="underline hover:text-[#D4AF37]">contact us</Link>.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
