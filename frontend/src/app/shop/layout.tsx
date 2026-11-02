import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Silk Sarees",
  description: "Browse handcrafted Kanchipuram silk sarees, dupattas, pavadas and silk materials.",
  alternates: { canonical: "/shop" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
