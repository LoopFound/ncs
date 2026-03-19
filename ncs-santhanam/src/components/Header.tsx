"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
    { label: "Wedding", href: "/wedding" },
    {
        label: "Kanchipuram",
        href: "/kanchipuram",
        hasDropdown: true,
        subItems: [
            { label: "Traditional", href: "/kanchipuram/traditional" },
            { label: "Borderless", href: "/kanchipuram/borderless" },
            { label: "Fancy Kanjivarams", href: "/kanchipuram/fancy-kanjivarams" },
            { label: "Exclusives", href: "/kanchipuram/exclusives" },
        ]
    },
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
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 ${isScrolled
                    ? "bg-[var(--navy)]/95 backdrop-blur-sm shadow-sm"
                    : "bg-transparent"
                    }`}
            >
                <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between h-20 lg:h-24">

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
                    <div className="hidden lg:flex items-center justify-center flex-1 mx-8 relative">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-[#F5F1E8] rounded-full px-6 py-3 shadow-lg flex items-center gap-4 xl:gap-6 relative z-10"
                        >
                            {navItems.map((item, index) => (
                                <div
                                    key={item.href}
                                    className="relative flex items-center group"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <Link
                                        href={item.href}
                                        className="text-[0.7rem] font-bold tracking-wider uppercase text-[var(--navy)] hover:text-[var(--gold)] transition-colors duration-300 flex items-center gap-1"
                                    >
                                        {item.label}
                                        {item.hasDropdown && (
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M1 1L5 5L9 1" />
                                            </svg>
                                        )}
                                    </Link>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {item.hasDropdown && hoveredIndex === index && item.subItems && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 pt-2 w-48"
                                            >
                                                <div className="bg-[#F5F1E8] rounded-xl shadow-xl overflow-hidden py-2 border border-[var(--navy)]/5">
                                                    {item.subItems.map((subItem) => (
                                                        <Link
                                                            key={subItem.href}
                                                            href={subItem.href}
                                                            className="block px-6 py-2 text-sm text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors uppercase tracking-wider text-[0.7rem] font-medium text-center"
                                                        >
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Separator (except for last item) */}
                                    {index < navItems.length - 1 && (
                                        <span className="ml-4 xl:ml-6 text-[var(--navy)]/20">|</span>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* 3. Action Buttons (Right) */}
                    <div className="hidden lg:flex items-center justify-end shrink-0">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-[#F5F1E8] rounded-full px-6 py-3 shadow-lg flex items-center gap-6"
                        >
                            <Link
                                href="/login"
                                className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[var(--navy)] hover:text-[var(--gold)] transition-colors"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <span className="hidden lg:inline">Log In</span>
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
                                <span className="hidden lg:inline">Cart</span>
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[var(--gold)] text-[var(--navy)] text-[9px] font-bold flex items-center justify-center rounded-full">{cartCount}</span>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden relative z-50 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
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
                        className="fixed inset-0 z-40 bg-[var(--navy)] lg:hidden overflow-y-auto"
                    >
                        <div className="flex flex-col items-center justify-center min-h-full py-20 gap-8">
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
                                        className="font-[var(--font-serif)] text-3xl text-white hover:text-[var(--gold)] transition-colors"
                                    >
                                        {item.label}
                                    </Link>

                                    {/* Mobile Sub-menu */}
                                    {item.subItems && (
                                        <div className="flex flex-col items-center gap-3">
                                            {item.subItems.map(subItem => (
                                                <Link
                                                    key={subItem.href}
                                                    href={subItem.href}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                    className="text-sm text-white/70 hover:text-[var(--gold)] uppercase tracking-widest"
                                                >
                                                    {subItem.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
