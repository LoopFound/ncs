"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "failed"; error: string };

export default function NewsletterSection() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>({ kind: "idle" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status.kind === "sending") return;
        const address = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
            setStatus({ kind: "failed", error: "Please enter a valid email address." });
            return;
        }
        setStatus({ kind: "sending" });
        const result = await subscribeNewsletter(address);
        if (!result.ok) {
            // Keep the address so the customer can retry.
            setStatus({ kind: "failed", error: result.fields?.email ?? result.error });
            return;
        }
        setEmail("");
        setStatus({ kind: "sent" });
    };

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

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" aria-describedby="newsletter-status">
                        <input
                            type="email"
                            name="email"
                            required
                            maxLength={254}
                            autoComplete="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (status.kind === "failed") setStatus({ kind: "idle" });
                            }}
                            aria-label="Email address"
                            aria-invalid={status.kind === "failed" ? true : undefined}
                            placeholder="Enter your email address"
                            className="flex-1 bg-white/5 border border-white/20 px-5 py-3.5 rounded text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                            type="submit"
                            disabled={status.kind === "sending"}
                            className="px-7 py-3.5 bg-[#D4AF37] text-[#08153A] text-xs tracking-[0.2em] uppercase font-bold rounded shadow-md shrink-0 hover:bg-[#E5C158] transition-colors disabled:cursor-wait disabled:opacity-60"
                        >
                            {status.kind === "sending" ? "Joining..." : "Subscribe"}
                        </button>
                    </form>

                    <p id="newsletter-status" role="status" aria-live="polite" className={`text-xs mt-4 font-light ${status.kind === "failed" ? "text-[#F3C6C6]" : status.kind === "sent" ? "text-[#D4AF37]" : "text-white/60"}`}>
                        {status.kind === "sent" && "Thank you for joining The Silk Circle."}
                        {status.kind === "failed" && status.error}
                        {(status.kind === "idle" || status.kind === "sending") && (
                            <>
                                For showroom invitations, you can also{" "}
                                <Link href="/contact" className="underline hover:text-[#D4AF37]">contact us</Link>.
                            </>
                        )}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
