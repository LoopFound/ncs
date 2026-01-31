"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const footerLinks = {
    shop: [
        { label: "Wedding Silks", href: "/shop?category=wedding" },
        { label: "Kanchipuram Silk", href: "/shop?category=kanchipuram" },
        { label: "Soft Silk", href: "/shop?category=soft-silk" },
        { label: "Gift Sarees", href: "/shop?category=gifts" },
        { label: "New Arrivals", href: "/new" },
    ],
    company: [
        { label: "Our Story", href: "/about" },
        { label: "Contact Us", href: "/contact" },
        { label: "Store Location", href: "/contact#location" },
    ],
    support: [
        { label: "Shipping Policy", href: "/policies/shipping" },
        { label: "Returns & Exchange", href: "/policies/returns" },
        { label: "Privacy Policy", href: "/policies/privacy" },
    ],
};

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="bg-[var(--navy)] text-white relative overflow-hidden">
            {/* Decorative Top Border */}
            <div className="w-full h-1 bg-gradient-to-r from-[var(--navy)] via-[var(--gold)] to-[var(--navy)] opacity-40" />

            {/* Main Footer Content */}
            <div className="container mx-auto px-6 lg:px-12 pt-24 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">

                    {/* Brand Column (Span 4) */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full">
                        <div>
                            <Link href="/" className="inline-block group">
                                <h2 className="font-[var(--font-serif)] text-4xl lg:text-5xl font-light tracking-wide text-white group-hover:text-[var(--gold)] transition-colors duration-500">
                                    NCS Santhanam
                                </h2>
                                <span className="block text-[10px] tracking-[0.4em] uppercase text-[#C5A059] mt-3 ml-1">
                                    Est. 1975 • Kanchipuram
                                </span>
                            </Link>

                            <p className="mt-8 text-[#F5F1E8] text-base leading-relaxed max-w-sm font-light">
                                Weaving the threads of tradition into timeless masterpieces.
                                Each saree is a testament to the artistry of Kanchipuram's
                                finest weavers, crafted for generations to come.
                            </p>
                        </div>

                        <div className="mt-12 lg:mt-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#C5A059] mb-4">Connect</p>
                            <div className="flex gap-6">
                                {[
                                    { name: 'Instagram', url: '#' },
                                    { name: 'Facebook', url: '#' },
                                    { name: 'WhatsApp', url: '#' }
                                ].map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.url}
                                        className="text-sm text-[#F5F1E8] hover:text-[var(--gold)] transition-colors duration-300 border-b border-transparent hover:border-[var(--gold)] pb-0.5"
                                    >
                                        {social.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Links Grid (Span 4) */}
                    <div className="lg:col-span-4 grid grid-cols-2 gap-12">
                        <div>
                            <h4 className="font-[var(--font-serif)] text-xl text-white mb-8 italic">Collections</h4>
                            <ul className="space-y-4">
                                {footerLinks.shop.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-[#F5F1E8] hover:text-[var(--gold)] hover:translate-x-1 transition-all duration-300 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-[var(--font-serif)] text-xl text-white mb-8 italic">Service</h4>
                            <ul className="space-y-4">
                                {[...footerLinks.company, ...footerLinks.support].map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-[#F5F1E8] hover:text-[var(--gold)] hover:translate-x-1 transition-all duration-300 inline-block"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Newsletter Column (Span 3) */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/5 p-8 border border-white/10 relative overflow-hidden group">
                            {/* Decorative sheen */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)]/10 rounded-full blur-2xl -mr-16 -mt-16 transition-all duration-1000 group-hover:bg-[var(--gold)]/20" />

                            <h4 className="font-[var(--font-serif)] text-2xl text-white mb-4 relative z-10">
                                The Silk Circle
                            </h4>
                            <p className="text-sm text-[#F5F1E8] mb-6 leading-relaxed relative z-10">
                                Join our exclusive list for early access to new weaves and private exhibitions.
                            </p>

                            <form className="relative z-10 space-y-4">
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        className="w-full bg-transparent border-b border-white/30 py-3 text-sm text-[#F5F1E8] placeholder:text-white/50 focus:outline-none focus:border-[var(--gold)] transition-colors"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-[var(--gold)] text-[var(--navy)] font-medium py-3 text-xs tracking-[0.2em] uppercase hover:bg-white transition-colors duration-300 mt-4"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="text-[#F5F1E8] opacity-60 text-[10px] uppercase tracking-[0.1em] space-y-2">
                        <p>© {new Date().getFullYear()} NCS Santhanam Silks. All Rights Reserved.</p>
                        <p>Designed with care in Kanchipuram.</p>
                    </div>

                    <button
                        onClick={scrollToTop}
                        className="group flex items-center gap-2 text-white/80 hover:text-[var(--gold)] transition-colors duration-300"
                    >
                        <span className="text-[10px] uppercase tracking-widest">Back to Top</span>
                        <span className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[var(--gold)] transition-colors">
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                className="group-hover:-translate-y-0.5 transition-transform duration-300"
                            >
                                <path d="M12 19V5M5 12l7-7 7 7" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>

            {/* Background Texture/Grain (Simulated with CSS) */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/grain.png')] mix-blend-overlay" />
        </footer>
    );
}
