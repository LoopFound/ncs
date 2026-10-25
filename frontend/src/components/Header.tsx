"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { label: "Wedding", href: "/wedding" },
    { label: "Kanchipuram", href: "/kanchipuram" },
    { label: "Soft silk", href: "/soft-silk" },
    { label: "Gift Sarees", href: "/gift-sarees" },
    { label: "Pavadas", href: "/pavadas" },
    { label: "Dupattas", href: "/dupattas" },
    { label: "Men's Corner", href: "/mens-corner" },
    { label: "Materials", href: "/materials" },
];

import { useCart } from "@/context/CartContext";

export default function Header() {
    const { cartCount } = useCart();
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 ${isScrolled || pathname !== "/"
                    ? "bg-[var(--navy)]/95 backdrop-blur-sm shadow-sm"
                    : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-6 lg:px-8 2xl:px-12 flex items-center justify-between h-20 lg:h-24 gap-4">

                    {/* 1. Logo (Left) */}
                    <Link href="/" className="relative z-50 shrink-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="flex items-center"
                        >
                            <Image
                                src="/logo1.jpg"
                                alt="NCS Santhanam"
                                width={120}
                                height={40}
                                className="h-10 lg:h-14 w-auto object-contain"
                                priority
                            />
                        </motion.div>
                    </Link>

                    {/* 2. Navigation Pill (Center) */}
                    <nav aria-label="Main navigation" className="relative hidden min-w-0 flex-1 items-center justify-center xl:flex">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="relative z-10 flex items-center gap-2 rounded-full bg-[#F5F1E8] px-4 py-3 shadow-lg 2xl:gap-5 2xl:px-5"
                        >
                            {navItems.map((item, index) => (
                                <div
                                    key={item.href}
                                    className="relative flex items-center group"
                                >
                                    <Link
                                        href={item.href}
                                        className="flex items-center whitespace-nowrap text-[0.58rem] font-bold uppercase tracking-wider text-[var(--navy)] transition-colors duration-300 hover:text-[var(--gold-text)] 2xl:text-[0.7rem]"
                                    >
                                        {item.label}
                                    </Link>

                                    {/* Separator (except for last item) */}
                                    {index < navItems.length - 1 && (
                                        <span aria-hidden="true" className="ml-2 text-[var(--navy)]/20 2xl:ml-5">|</span>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    </nav>

                    {/* 3. Action Buttons (Right) */}
                    <div className="hidden shrink-0 items-center justify-end xl:flex">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="flex items-center gap-3 rounded-full bg-[#F5F1E8] px-4 py-3 shadow-lg 2xl:gap-6 2xl:px-6"
                        >
                            <Link
                                href="/login"
                                className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[var(--navy)] hover:text-[var(--gold)] transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="hidden 2xl:inline">Log In</span>
                            </Link>
                            <Link
                                href="/cart"
                                className="relative flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[var(--navy)] hover:text-[var(--gold)] transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                <span className="hidden 2xl:inline">Cart</span>
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[var(--gold)] text-[var(--navy)] text-[9px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="relative z-50 min-h-11 min-w-11 p-3 xl:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="mobile-navigation"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <span
                                className={`block h-[1.5px] transition-all duration-300 ${isMobileMenuOpen
                                    ? "rotate-45 translate-y-2 bg-white"
                                    : (isScrolled ? "bg-white" : "bg-[var(--white)]")
                                    }`}
                            />
                            <span
                                className={`block h-[1.5px] transition-all duration-300 ${isMobileMenuOpen
                                    ? "opacity-0"
                                    : (isScrolled ? "bg-white" : "bg-[var(--white)]")
                                    }`}
                            />
                            <span
                                className={`block h-[1.5px] transition-all duration-300 ${isMobileMenuOpen
                                    ? "-rotate-45 -translate-y-2 bg-white"
                                    : (isScrolled ? "bg-white" : "bg-[var(--white)]")
                                    }`}
                            />
                        </div>
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        id="mobile-navigation"
                        className="fixed inset-0 z-40 overflow-y-auto bg-[var(--navy)] xl:hidden"
                    >
                        <nav aria-label="Mobile navigation" className="flex flex-col items-center justify-center min-h-full px-6 pt-28 pb-12 gap-6">
                            {navItems.map((item, index) => (
                                <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="flex flex-col items-center gap-4"
                                >
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex min-h-11 items-center font-[var(--font-serif)] text-3xl text-white transition-colors hover:text-[var(--gold)]"
                                    >
                                        {item.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="flex gap-8 border-t border-white/20 pt-6 mt-2 text-sm uppercase tracking-widest text-white">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>Cart ({cartCount})</Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
