import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soft Silk Sarees",
  description: "Lightweight soft silk sarees that are easy to drape.",
  alternates: { canonical: "/soft-silk" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
