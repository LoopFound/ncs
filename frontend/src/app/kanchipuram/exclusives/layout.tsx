import type { Metadata } from "next";

export const metadata: Metadata = {
  // The parent layout's plain title resets the root template.
  title: { absolute: "Exclusive Kanjivarams | NCS Santhanam" },
  description: "Collector-grade exclusive Kanjivaram silk sarees.",
  alternates: { canonical: "/kanchipuram/exclusives" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
