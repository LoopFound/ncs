import type { Metadata } from "next";

export const metadata: Metadata = {
  // The parent layout's plain title resets the root template.
  title: { absolute: "Traditional Kanchipuram Sarees | NCS Santhanam" },
  description: "Traditional Kanchipuram silk sarees with Korvai borders and classic motifs.",
  alternates: { canonical: "/kanchipuram/traditional" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
