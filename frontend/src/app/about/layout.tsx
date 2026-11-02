import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Heritage",
  description: "The story of NCS Santhanam, weaving Kanchipuram silk heirlooms since 1975.",
  alternates: { canonical: "/about" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
