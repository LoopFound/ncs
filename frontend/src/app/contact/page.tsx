"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";

const SHOWROOM_MAP_QUERY = encodeURIComponent("59, Viladadikoil Street, Kancheepuram, Tamil Nadu 631501");

export default function ContactPage() {
    return (
        <div className="pt-header pb-24">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-4">
                            Get in Touch
                        </span>
                        <h1 className="font-serif text-5xl lg:text-6xl font-light text-[var(--charcoal)] mb-8">
                            Visit Our <br />
                            <span className="italic">Showroom</span>
                        </h1>

                        <div className="space-y-8 mb-12">
                            <div>
                                <h2 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Address</h2>
                                <p className="text-[var(--charcoal-light)] leading-relaxed">
                                    59, Viladadikoil Street,<br />
                                    Kancheepuram, Tamil Nadu – 631501
                                </p>
                            </div>

                            <div>
                                <h2 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Contact</h2>
                                <p className="text-[var(--charcoal-light)] hover:text-[var(--gold)] transition-colors">
                                    <a href="tel:+919876543210">+91 98765 43210</a>
                                </p>
                                <p className="text-[var(--charcoal-light)] hover:text-[var(--gold)] transition-colors">
                                    <a href="mailto:hello@ncsanthanam.in">hello@ncsanthanam.in</a>
                                </p>
                            </div>

                            <div>
                                <h2 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Hours</h2>
                                <p className="text-[var(--charcoal-light)]">
                                    Monday – Saturday: 10am – 8pm<br />
                                    Sunday: 10am – 2pm
                                </p>
                            </div>
                        </div>

                        <div className="aspect-video bg-[var(--greige)] relative overflow-hidden border border-[var(--border)]">
                            <iframe
                                title="Map showing the NCS Santhanam showroom in Kancheepuram"
                                src={`https://www.google.com/maps?q=${SHOWROOM_MAP_QUERY}&output=embed`}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0 h-full w-full border-0"
                            />
                        </div>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${SHOWROOM_MAP_QUERY}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-3 text-xs uppercase tracking-widest text-[var(--navy)] underline underline-offset-4 hover:text-[var(--gold-text)] transition-colors"
                        >
                            Open in Google Maps
                        </a>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-[var(--cream)] p-8 lg:p-12 border border-[var(--border)]"
                    >
                        <h2 className="font-serif text-3xl text-[var(--charcoal)] mb-8">Send us a Message</h2>

                        <Suspense fallback={null}>
                            <ContactForm />
                        </Suspense>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
