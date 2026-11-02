"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TEXTILE_BY_ROUTE: [string, string][] = [
  ["/wedding", "textile-lotus"],
  ["/kanchipuram", "textile-temple"],
  ["/soft-silk", "textile-paisley"],
  ["/gift-sarees", "textile-paisley"],
  ["/pavadas", "textile-lotus"],
  ["/dupattas", "textile-paisley"],
  ["/mens-corner", "textile-kattam"],
  ["/materials", "textile-kattam"],
  ["/about", "textile-temple"],
  ["/contact", "textile-lotus"],
  ["/collections", "textile-temple"],
  ["/faq", "textile-kattam"],
  ["/policies", "textile-kattam"],
  ["/login", "textile-lotus"],
];

function textileForRoute(pathname: string) {
  const match = TEXTILE_BY_ROUTE.find(
    ([route]) => pathname === route || pathname.startsWith(`${route}/`)
  );
  return match ? match[1] : "textile-butta";
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";
  const textile = textileForRoute(pathname);

  if (isAuthRoute) {
    return <main className={`min-h-screen ${textile}`}>{children}</main>;
  }

  return (
    <>
      <Header />
      <main className={`flex flex-1 flex-col ${textile}`}>{children}</main>
      <Footer />
    </>
  );
}
