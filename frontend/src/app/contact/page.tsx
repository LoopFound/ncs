"use client";

import { motion } from "framer-motion";

export default function ContactPage() {
    return (
        <div className="pt-24 lg:pt-32 pb-24">
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
                        <h1 className="font-[var(--font-serif)] text-5xl lg:text-6xl font-light text-[var(--charcoal)] mb-8">
                            Visit Our <br />
                            <span className="italic">Showroom</span>
                        </h1>

                        <div className="space-y-8 mb-12">
                            <div>
                                <h3 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Address</h3>
                                <p className="text-[var(--charcoal-light)] leading-relaxed">
                                    59, Viladadikoil Street,<br />
                                    Kancheepuram, Tamil Nadu – 631501
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Contact</h3>
                                <p className="text-[var(--charcoal-light)] hover:text-[var(--gold)] transition-colors">
                                    <a href="tel:+919876543210">+91 98765 43210</a>
                                </p>
                                <p className="text-[var(--charcoal-light)] hover:text-[var(--gold)] transition-colors">
                                    <a href="mailto:hello@ncsanthanam.in">hello@ncsanthanam.in</a>
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Hours</h3>
                                <p className="text-[var(--charcoal-light)]">
                                    Monday – Saturday: 10am – 8pm<br />
                                    Sunday: 10am – 2pm
                                </p>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="aspect-video bg-[var(--greige)] relative overflow-hidden border border-[var(--border)]">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[var(--charcoal-muted)] text-xs tracking-widest uppercase">
                                    Google Map Integration
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-[var(--cream)] p-8 lg:p-12 border border-[var(--border)]"
                    >
                        <h3 className="font-[var(--font-serif)] text-3xl text-[var(--charcoal)] mb-8">Send us a Message</h3>

                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2">Name</label>
                                    <input type="text" id="name" className="w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2">Email</label>
                                    <input type="email" id="email" className="w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors" />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2">Subject</label>
                                <input type="text" id="subject" className="w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors" />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2">Message</label>
                                <textarea id="message" rows={6} className="w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors resize-none"></textarea>
                            </div>

                            <button type="submit" className="w-full bg-[var(--charcoal)] text-white py-4 text-sm tracking-[0.15em] uppercase hover:bg-black transition-colors">
                                Send Message
                            </button>
                        </form>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
