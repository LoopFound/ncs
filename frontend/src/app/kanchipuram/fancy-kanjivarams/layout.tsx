import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fancy Kanjivarams",
  description: "Modern fancy Kanjivaram silk sarees in shot silks and new motifs.",
  alternates: { canonical: "/kanchipuram/fancy-kanjivarams" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
