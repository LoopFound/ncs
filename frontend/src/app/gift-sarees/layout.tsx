import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Sarees",
  description: "Pure silk sarees curated for gifting and auspicious occasions.",
  alternates: { canonical: "/gift-sarees" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
