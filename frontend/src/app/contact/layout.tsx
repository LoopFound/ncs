import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Showroom",
  description: "Visit the NCS Santhanam showroom in Kancheepuram or send us a message.",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
