import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding Silks",
  description: "Handwoven bridal and wedding silk sarees from Kanchipuram.",
  alternates: { canonical: "/wedding" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
