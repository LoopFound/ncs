import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3100"),
  title: { default: "NCS Santhanam | Pure Kanchipuram Silk Sarees", template: "%s | NCS Santhanam" },
  description:
    "Handwoven pure silk sarees from Kanchipuram since 1975 — wedding silks, Kanchipuram classics, soft silks, gift sarees, pavadas, dupattas and men's silk veshtis.",
  keywords: ["silk sarees", "Kanchipuram sarees", "wedding sarees", "Indian silk", "pattu sarees", "NCS Santhanam"],
  openGraph: { siteName: "NCS Santhanam", type: "website", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#0B1B4D" };

// Every page reads the session, cart or live catalog, so nothing is prerendered at build time
// (builds run without database access). Data is cached in Redis instead — see src/server/cache.ts.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--text-body)] antialiased">{children}</body>
    </html>
  );
}
