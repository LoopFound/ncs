"use client";

import Link from "next/link";

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <footer className="bg-[#071333] text-[#FAF7F0] border-t border-[#D4AF37]/40 mt-auto relative z-20">
            {/* Top gold hairline accent */}
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />

            <div className="container mx-auto px-6 lg:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
                    
                    {/* Brand & Showroom (Span 5) */}
                    <div className="lg:col-span-5 space-y-4">
                        <Link href="/" className="inline-block group">
                            <h2 className="font-[var(--font-serif)] text-3xl sm:text-4xl !text-[#FAF7F0] tracking-wide group-hover:!text-[#E5C158] transition-colors">
                                NCS Santhanam
                            </h2>
                            <span className="block text-xs tracking-[0.35em] uppercase !text-[#E5C158] font-semibold mt-1">
                                Est. 1975 • Kanchipuram
                            </span>
                        </Link>

                        <p className="text-sm !text-[#E2E8F0] font-light leading-relaxed max-w-sm">
                            Handcrafting pure Kanchipuram silk sarees with certified Silk Mark authenticity, authentic gold zari, and timeless temple motifs.
                        </p>

                        <div className="pt-2 text-xs !text-[#E2E8F0] space-y-2 font-normal">
                            <p className="!text-[#E2E8F0]">
                                <span className="!text-[#E5C158] font-semibold">Showroom:</span> 59, Viladadikoil Street, Kancheepuram, Tamil Nadu – 631501
                            </p>
                            <p className="!text-[#E2E8F0]">
                                <span className="!text-[#E5C158] font-semibold">Hours:</span> Mon – Sat: 10:00 AM – 8:00 PM | Sun: 10:00 AM – 2:00 PM
                            </p>
                            <p className="!text-[#E2E8F0]">
                                <span className="!text-[#E5C158] font-semibold">Phone:</span> +91 98765 43210
                            </p>
                            <p className="!text-[#E2E8F0]">
                                <span className="!text-[#E5C158] font-semibold">Email:</span> concierge@ncsanthanam.in
                            </p>
                        </div>

                        {/* WhatsApp Concierge link */}
                        <div className="pt-3">
                            <a
                                href="https://wa.me/919876543210"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#D4AF37]/50 bg-white/10 text-xs !text-[#FAF7F0] hover:!text-[#E5C158] hover:border-[#E5C158] transition-colors font-medium shadow-xs"
                            >
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                                <span>WhatsApp Concierge & Video Shopping</span>
                            </a>
                        </div>
                    </div>

                    {/* Collections (Span 3) */}
                    <div className="lg:col-span-3">
                        <h4 className="font-[var(--font-serif)] text-xl !text-[#FAF7F0] mb-5 tracking-wide flex items-center gap-2">
                            <span>Collections</span>
                            <span className="h-px w-6 bg-[#D4AF37]" />
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/wedding" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Wedding Silks
                                </Link>
                            </li>
                            <li>
                                <Link href="/kanchipuram" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Kanchipuram Classics
                                </Link>
                            </li>
                            <li>
                                <Link href="/soft-silk" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Soft Silks
                                </Link>
                            </li>
                            <li>
                                <Link href="/gift-sarees" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Gift Sarees
                                </Link>
                            </li>
                            <li>
                                <Link href="/new" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    New Arrivals
                                </Link>
                            </li>
                            <li>
                                <Link href="/mens-corner" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Men&apos;s Corner & Dhotis
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Client Care & Policies (Span 4) */}
                    <div className="lg:col-span-4">
                        <h4 className="font-[var(--font-serif)] text-xl !text-[#FAF7F0] mb-5 tracking-wide flex items-center gap-2">
                            <span>Client Care</span>
                            <span className="h-px w-6 bg-[#D4AF37]" />
                        </h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/about" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Our Heritage & Story
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Visit Kanchipuram Showroom
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Care Guide & FAQs
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/shipping" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Shipping & Delivery Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/returns" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Returns & Exchange Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/privacy" className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Clean Bottom Bar */}
                <div className="mt-14 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs !text-[#CBD5E1]">
                    <p className="!text-[#CBD5E1]">© 2026 NCS Santhanam Silks. Kanchipuram, India.</p>

                    <button
                        onClick={scrollToTop}
                        aria-label="Back to top"
                        className="flex items-center gap-2 !text-[#E5C158] hover:!text-white transition-colors cursor-pointer"
                    >
                        <span className="uppercase tracking-[0.2em] text-[10px] font-semibold">Back to Top</span>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                        >
                            <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </footer>
    );
}
