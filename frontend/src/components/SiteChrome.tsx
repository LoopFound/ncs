"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login";

  if (isAuthRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </>
  );
}
