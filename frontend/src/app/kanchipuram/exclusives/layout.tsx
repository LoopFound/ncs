import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusive Kanjivarams",
  description: "Collector-grade exclusive Kanjivaram silk sarees.",
  alternates: { canonical: "/kanchipuram/exclusives" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
