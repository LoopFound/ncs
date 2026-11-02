import type { Metadata } from "next";

export const metadata: Metadata = {
  // The parent layout's plain title resets the root template.
  title: { absolute: "Fancy Kanjivarams | NCS Santhanam" },
  description: "Modern fancy Kanjivaram silk sarees in shot silks and new motifs.",
  alternates: { canonical: "/kanchipuram/fancy-kanjivarams" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
