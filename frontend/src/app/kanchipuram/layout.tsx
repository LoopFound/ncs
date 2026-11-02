import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kanchipuram Silk Sarees",
  description: "Authentic handwoven Kanchipuram silk sarees, from traditional to contemporary.",
  alternates: { canonical: "/kanchipuram" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
