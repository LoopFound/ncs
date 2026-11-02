import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Silk Materials",
  description: "Pure silk brocade fabric for blouses and custom garments.",
  alternates: { canonical: "/materials" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
