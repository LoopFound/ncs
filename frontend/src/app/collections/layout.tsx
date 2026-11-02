import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Collections",
  description: "Explore wedding silks, Kanchipuram classics, soft silks and gift collections.",
  alternates: { canonical: "/collections" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
