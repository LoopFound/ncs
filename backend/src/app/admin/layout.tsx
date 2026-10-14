import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/server/session";
import SignOutButton from "@/components/auth/SignOutButton";
import { CartProvider } from "@/context/CartContext";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | NCS Santhanam" }, robots: { index: false, follow: false } };

const sections: { heading: string; links: { href: string; label: string; adminOnly?: boolean }[] }[] = [
  { heading: "Overview", links: [{ href: "/admin", label: "Dashboard" }] },
  {
    heading: "Sales",
    links: [
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/coupons", label: "Coupons", adminOnly: true },
    ],
  },
  {
    heading: "Catalog",
    links: [
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/inventory", label: "Inventory" },
    ],
  },
  {
    heading: "Content",
    links: [
      { href: "/admin/banners", label: "Homepage banners" },
      { href: "/admin/reviews", label: "Reviews" },
      { href: "/admin/messages", label: "Messages" },
      { href: "/admin/newsletter", label: "Newsletter" },
    ],
  },
  {
    heading: "System",
    links: [
      { href: "/admin/settings", label: "Store & shipping", adminOnly: true },
      { href: "/admin/audit", label: "Audit log", adminOnly: true },
    ],
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  return (
    <CartProvider>
      <div className="min-h-screen flex bg-[#F7F5EF]">
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--navy)] text-white">
          <Link href="/admin" className="px-6 py-6 font-serif !text-2xl !text-[#E5C158] border-b border-white/10">
            NCS Admin
          </Link>
          <nav aria-label="Admin" className="flex-1 overflow-y-auto py-4">
            {sections.map((s) => (
              <div key={s.heading} className="mb-4">
                <p className="px-6 text-[10px] uppercase tracking-[0.25em] !text-white/40 !mb-1">{s.heading}</p>
                <ul>
                  {s.links
                    .filter((l) => !l.adminOnly || user.role === "admin")
                    .map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="block px-6 py-1.5 text-sm !text-white/85 hover:!text-[#E5C158] hover:bg-white/5">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="p-6 border-t border-white/10 text-xs space-y-3">
            <p className="!text-white/60 !mb-0 !text-xs">
              {user.name} · {user.role}
            </p>
            <Link href="/" className="block !text-white/80 hover:!text-[#E5C158]">
              ← View storefront
            </Link>
            <SignOutButton className="!text-white/80 hover:!text-[#E5C158]" />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <header className="md:hidden bg-[var(--navy)] px-4 py-3 flex items-center justify-between">
            <Link href="/admin" className="font-serif !text-xl !text-[#E5C158]">
              NCS Admin
            </Link>
            <details className="relative">
              <summary className="list-none cursor-pointer text-white text-sm">Menu</summary>
              <ul className="absolute right-0 mt-2 w-56 bg-white shadow-xl border border-[var(--border)] z-50 py-2">
                {sections
                  .flatMap((s) => s.links)
                  .filter((l) => !l.adminOnly || user.role === "admin")
                  .map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="block px-4 py-2 text-sm text-[var(--navy)]">
                        {l.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </details>
          </header>
          <main id="main" className="p-6 lg:p-10 max-w-7xl">
            {children}
          </main>
        </div>
      </div>
    </CartProvider>
  );
}
