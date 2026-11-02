import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "What's New",
  description: "The newest handcrafted silk arrivals from NCS Santhanam.",
  alternates: { canonical: "/new" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
