import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Traditional Kanchipuram Sarees",
  description: "Traditional Kanchipuram silk sarees with Korvai borders and classic motifs.",
  alternates: { canonical: "/kanchipuram/traditional" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
