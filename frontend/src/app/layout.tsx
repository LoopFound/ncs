import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-body)] antialiased">
        <CartProvider>
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
