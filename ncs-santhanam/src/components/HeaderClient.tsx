"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import SearchBox from "./SearchBox";

export interface NavItem {
  label: string;
  href: string;
  children: { label: string; href: string }[];
}

interface Props {
  nav: NavItem[];
  user: { name: string; isStaff: boolean } | null;
}

const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function HeaderClient({ nav, user }: Props) {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on navigation (adjust state during render instead of in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setIsMobileMenuOpen(false);
    setOpenIndex(null);
  }

  // Lock page scroll and support Escape while the mobile menu is open.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMobileMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isMobileMenuOpen]);

  const accountHref = user ? (user.isStaff ? "/admin" : "/account") : "/login";
  const accountLabel = user ? (user.isStaff ? "Admin" : "Account") : "Log In";
  const cartLabel = `Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 ${
          isScrolled || isMobileMenuOpen ? "bg-[var(--navy)]/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 lg:px-12 flex items-center justify-between h-20 lg:h-24 gap-4">
          {/* Logo */}
          <Link href="/" className="relative z-50 shrink-0" aria-label="NCS Santhanam — home">
            <Image src="/logo1.jpg" alt="NCS Santhanam" width={120} height={40} className="h-10 lg:h-14 w-auto object-contain" priority />
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Collections" className="hidden xl:flex items-center justify-center flex-1 mx-6">
            <ul className="bg-[#F5F1E8] rounded-full px-6 py-3 shadow-lg flex items-center gap-4 2xl:gap-6">
              {nav.map((item, index) => {
                const hasChildren = item.children.length > 0;
                const isOpen = openIndex === index;
                return (
                  <li
                    key={item.href}
                    className="relative flex items-center"
                    onMouseEnter={() => hasChildren && setOpenIndex(index)}
                    onMouseLeave={() => hasChildren && setOpenIndex(null)}
                    onFocus={() => hasChildren && setOpenIndex(index)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpenIndex(null);
                    }}
                  >
                    <Link
                      href={item.href}
                      aria-haspopup={hasChildren ? "true" : undefined}
                      aria-expanded={hasChildren ? isOpen : undefined}
                      className={`text-[0.7rem] font-bold tracking-wider uppercase transition-colors duration-300 flex items-center gap-1 ${
                        pathname === item.href || pathname.startsWith(`${item.href}/`) ? "text-[var(--gold-text)]" : "text-[var(--navy)] hover:text-[var(--gold-text)]"
                      }`}
                    >
                      {item.label}
                      {hasChildren && (
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                          <path d="M1 1L5 5L9 1" />
                        </svg>
                      )}
                    </Link>

                    <AnimatePresence>
                      {hasChildren && isOpen && (
                        <motion.ul
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-52"
                        >
                          <li className="bg-[#F5F1E8] rounded-xl shadow-xl overflow-hidden py-2 border border-[var(--navy)]/5">
                            {item.children.map((sub) => (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                className="block px-6 py-2 text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white focus:bg-[var(--navy)] focus:text-white transition-colors uppercase tracking-wider text-[0.7rem] font-medium text-center"
                              >
                                {sub.label}
                              </Link>
                            ))}
                          </li>
                        </motion.ul>
                      )}
                    </AnimatePresence>

                    {index < nav.length - 1 && (
                      <span className="ml-4 2xl:ml-6 text-[var(--navy)]/20" aria-hidden="true">
                        |
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 shrink-0">
            <div className="hidden md:block">
              <SearchBox />
            </div>
            <div className="hidden xl:flex bg-[#F5F1E8] rounded-full px-6 py-3 shadow-lg items-center gap-6">
              <Link href={accountHref} className="flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[var(--navy)] hover:text-[var(--gold-text)] transition-colors">
                <UserIcon />
                <span>{accountLabel}</span>
              </Link>
              <Link href="/cart" aria-label={cartLabel} className="relative flex items-center gap-2 text-xs uppercase tracking-widest font-medium text-[var(--navy)] hover:text-[var(--gold-text)] transition-colors">
                <BagIcon />
                <span>Bag</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 bg-[var(--gold)] text-[var(--navy)] text-[9px] font-bold flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

            {/* Mobile: always-visible bag */}
            <Link href="/cart" aria-label={cartLabel} className="xl:hidden relative z-50 p-2 text-white">
              <BagIcon />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-[var(--gold)] text-[var(--navy)] text-[9px] font-bold flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="xl:hidden relative z-50 p-2"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-[1.5px] bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[var(--navy)] xl:hidden overflow-y-auto"
          >
            <div className="flex flex-col items-center min-h-full pt-32 pb-16 px-6 gap-7">
              <div className="w-full max-w-sm">
                <SearchBox variant="dark" />
              </div>
              <div className="flex gap-3">
                <Link href={accountHref} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/25 text-white text-xs uppercase tracking-widest">
                  <UserIcon />
                  {accountLabel}
                </Link>
                <Link href="/cart" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--gold)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold">
                  <BagIcon />
                  Bag ({cartCount})
                </Link>
              </div>
              {nav.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Link href={item.href} className="font-serif text-3xl text-white hover:text-[var(--gold)] transition-colors">
                    {item.label}
                  </Link>
                  {item.children.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                      {item.children.map((sub) => (
                        <Link key={sub.href} href={sub.href} className="text-sm text-white/70 hover:text-[var(--gold)] uppercase tracking-widest">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              <Link href="/new" className="font-serif text-3xl text-[var(--gold)]">
                New Arrivals
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
