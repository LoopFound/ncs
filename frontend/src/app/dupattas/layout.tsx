import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Silk Dupattas",
  description: "Handwoven pure silk dupattas with zari detailing.",
  alternates: { canonical: "/dupattas" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
