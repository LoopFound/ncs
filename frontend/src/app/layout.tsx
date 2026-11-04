import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import { CartProvider } from "@/context/CartContext";
import { SessionProvider } from "@/context/SessionContext";
import { SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NCS Santhanam | Premium Silk Boutique",
    template: "%s | NCS Santhanam",
  },
  description: "Discover exquisite handcrafted silk sarees from Kanchipuram. Wedding silks, Kanchipuram classics, and luxury collections crafted with heritage and tradition.",
  keywords: ["silk sarees", "Kanchipuram sarees", "wedding sarees", "Indian silk", "luxury sarees", "NCS Santhanam"],
  openGraph: {
    title: "NCS Santhanam | Premium Silk Boutique",
    description: "Discover exquisite handcrafted silk sarees from Kanchipuram.",
    type: "website",
    locale: "en_IN",
    siteName: "NCS Santhanam",
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-body)] antialiased">
        <SessionProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
