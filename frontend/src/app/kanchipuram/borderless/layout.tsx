import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Borderless Kanjivaram Sarees",
  description: "Contemporary borderless Kanjivaram silk sarees.",
  alternates: { canonical: "/kanchipuram/borderless" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
