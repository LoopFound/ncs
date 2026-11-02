import type { Metadata } from "next";

export const metadata: Metadata = {
  // The parent layout's plain title resets the root template.
  title: { absolute: "Borderless Kanjivaram Sarees | NCS Santhanam" },
  description: "Contemporary borderless Kanjivaram silk sarees.",
  alternates: { canonical: "/kanchipuram/borderless" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
