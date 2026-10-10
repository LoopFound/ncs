import type { Metadata } from "next";
import FaqClient from "@/components/FaqClient";
import { getStoreInfo, whatsappLink } from "@/server/services/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Care Guide & FAQs",
  description: "Silk Mark authenticity, caring for Kanchipuram silk, fall & pico, video shopping and showroom visits.",
  alternates: { canonical: "/faq" },
};

export default async function FAQPage() {
  const store = await getStoreInfo();
  return <FaqClient whatsappHref={whatsappLink(store, "Hello, I have a question about a saree.")} />;
}
