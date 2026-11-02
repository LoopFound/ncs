import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Men's Corner",
  description: "Pure silk dhotis and angavastrams for ceremonies and festivals.",
  alternates: { canonical: "/mens-corner" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
