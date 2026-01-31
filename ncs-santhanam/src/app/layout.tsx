import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NCS Santhanam | Premium Silk Boutique",
  description: "Discover exquisite handcrafted silk sarees from Kanchipuram. Wedding silks, Kanchipuram classics, and luxury collections crafted with heritage and tradition.",
  keywords: ["silk sarees", "Kanchipuram sarees", "wedding sarees", "Indian silk", "luxury sarees", "NCS Santhanam"],
  openGraph: {
    title: "NCS Santhanam | Premium Silk Boutique",
    description: "Discover exquisite handcrafted silk sarees from Kanchipuram.",
    type: "website",
    locale: "en_IN",
  },
};

import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable}`}>
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
