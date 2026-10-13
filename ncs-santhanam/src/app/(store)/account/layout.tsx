import Link from "next/link";
import { requireUser } from "@/server/session";
import SignOutButton from "@/components/auth/SignOutButton";

export const dynamic = "force-dynamic";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/wishlist", label: "Wishlist" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/account");
  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)] min-h-screen">
      <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold !mb-1">My account</p>
          <h1 className="font-serif !text-4xl text-[var(--navy)]">Namaste, {user.name.split(" ")[0]}</h1>
        </header>
        <div className="grid lg:grid-cols-4 gap-10">
          <nav aria-label="Account" className="lg:col-span-1">
            <ul className="flex lg:flex-col gap-2 overflow-x-auto">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="block px-4 py-2.5 text-sm text-[var(--navy)] bg-white border border-[var(--border)] hover:border-[var(--gold)] whitespace-nowrap">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <SignOutButton />
              </li>
            </ul>
          </nav>
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
