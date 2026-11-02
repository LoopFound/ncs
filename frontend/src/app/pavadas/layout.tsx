import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pattu Pavadas",
  description: "Pure silk Kanchipuram pattu pavadas for family celebrations.",
  alternates: { canonical: "/pavadas" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
