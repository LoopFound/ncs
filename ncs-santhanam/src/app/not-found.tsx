import type { Metadata } from "next";
import { connection } from "next/server";
import StoreChrome from "@/components/StoreChrome";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default async function NotFound() {
  // Render per request: the header/footer need live categories and store details,
  // and builds run without database access.
  await connection();
  return (
    <StoreChrome>
      <NotFoundContent />
    </StoreChrome>
  );
}
