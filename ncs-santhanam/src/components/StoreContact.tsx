import Link from "next/link";
import { getStoreInfo, whatsappLink } from "@/server/services/content";

const linkClass = "text-[var(--gold-text)] font-semibold underline";

/** "email us at … or WhatsApp …" rendered from the admin-managed store settings. */
export default async function StoreContact({ kind = "support" }: { kind?: "support" | "privacy" }) {
  const store = await getStoreInfo();
  const email = kind === "privacy" ? store.privacyEmail ?? store.supportEmail : store.supportEmail;
  const wa = whatsappLink(store);
  const parts: React.ReactNode[] = [];
  if (email)
    parts.push(
      <a key="e" href={`mailto:${email}`} className={linkClass}>
        {email}
      </a>,
    );
  if (wa && kind === "support")
    parts.push(
      <a key="w" href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>
        WhatsApp {store.whatsapp}
      </a>,
    );
  if (parts.length === 0)
    return (
      <Link href="/contact" className={linkClass}>
        our contact form
      </Link>
    );
  return <>{parts.length === 2 ? [parts[0], " or ", parts[1]] : parts[0]}</>;
}
