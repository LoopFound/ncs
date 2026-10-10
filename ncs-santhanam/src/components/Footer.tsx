import Link from "next/link";
import { getStoreInfo, whatsappLink, type StoreInfo } from "@/server/services/content";
import BackToTop from "./BackToTop";

const collections = [
  { href: "/wedding", label: "Wedding Silks" },
  { href: "/kanchipuram", label: "Kanchipuram Classics" },
  { href: "/soft-silk", label: "Soft Silks" },
  { href: "/gift-sarees", label: "Gift Sarees" },
  { href: "/new", label: "New Arrivals" },
  { href: "/mens-corner", label: "Men's Corner & Dhotis" },
];

const care = [
  { href: "/about", label: "Our Heritage & Story" },
  { href: "/contact", label: "Visit Kanchipuram Showroom" },
  { href: "/faq", label: "Care Guide & FAQs" },
  { href: "/policies/shipping", label: "Shipping & Delivery Policy" },
  { href: "/policies/returns", label: "Returns & Exchange Policy" },
  { href: "/policies/privacy", label: "Privacy Policy" },
  { href: "/policies/terms", label: "Terms of Service" },
];

const FALLBACK: Pick<StoreInfo, "addressLine" | "city" | "state" | "pincode" | "hours" | "phone" | "whatsapp" | "supportEmail" | "legalName"> = {
  addressLine: "59, Viladadikoil Street",
  city: "Kancheepuram",
  state: "Tamil Nadu",
  pincode: "631501",
  hours: "Mon – Sat: 10:00 AM – 8:00 PM | Sun: 10:00 AM – 2:00 PM",
  phone: null,
  whatsapp: null,
  supportEmail: null,
  legalName: "NCS Santhanam Silks",
};

export default async function Footer() {
  const store = await getStoreInfo().catch(() => FALLBACK);
  const wa = whatsappLink(store, "Hello NCS Santhanam, I'd like help choosing a saree.");

  return (
    <footer className="bg-[#071333] text-[#FAF7F0] border-t border-[#D4AF37]/40 mt-auto relative z-20">
      <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-90" />

      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-5 space-y-4">
            <Link href="/" className="inline-block group">
              <span className="block font-serif text-3xl sm:text-4xl !text-[#FAF7F0] tracking-wide group-hover:!text-[#E5C158] transition-colors">
                NCS Santhanam
              </span>
              <span className="block text-xs tracking-[0.35em] uppercase !text-[#E5C158] font-semibold mt-1">Est. 1975 • Kanchipuram</span>
            </Link>

            <p className="text-sm !text-[#E2E8F0] font-light leading-relaxed max-w-sm">
              Handcrafting pure Kanchipuram silk sarees with certified Silk Mark authenticity, authentic gold zari, and timeless temple motifs.
            </p>

            <address className="not-italic pt-2 text-xs !text-[#E2E8F0] space-y-2 font-normal">
              <p className="!text-[#E2E8F0] !text-xs">
                <span className="!text-[#E5C158] font-semibold">Showroom:</span> {store.addressLine}, {store.city}, {store.state} – {store.pincode}
              </p>
              <p className="!text-[#E2E8F0] !text-xs">
                <span className="!text-[#E5C158] font-semibold">Hours:</span> {store.hours}
              </p>
              {store.phone && (
                <p className="!text-[#E2E8F0] !text-xs">
                  <span className="!text-[#E5C158] font-semibold">Phone:</span>{" "}
                  <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="!text-[#E2E8F0] hover:!text-[#E5C158]">
                    {store.phone}
                  </a>
                </p>
              )}
              {store.supportEmail && (
                <p className="!text-[#E2E8F0] !text-xs">
                  <span className="!text-[#E5C158] font-semibold">Email:</span>{" "}
                  <a href={`mailto:${store.supportEmail}`} className="!text-[#E2E8F0] hover:!text-[#E5C158]">
                    {store.supportEmail}
                  </a>
                </p>
              )}
            </address>

            {wa && (
              <div className="pt-3">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#D4AF37]/50 bg-white/10 text-xs !text-[#FAF7F0] hover:!text-[#E5C158] hover:border-[#E5C158] transition-colors font-medium"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>WhatsApp Concierge & Video Shopping</span>
                </a>
              </div>
            )}
          </div>

          <nav aria-label="Collections" className="lg:col-span-3">
            <h2 className="font-serif !text-xl !text-[#FAF7F0] mb-5 tracking-wide flex items-center gap-2">
              <span>Collections</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </h2>
            <ul className="space-y-3 text-sm">
              {collections.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Client care" className="lg:col-span-4">
            <h2 className="font-serif !text-xl !text-[#FAF7F0] mb-5 tracking-wide flex items-center gap-2">
              <span>Client Care</span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </h2>
            <ul className="space-y-3 text-sm">
              {care.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="!text-[#E2E8F0] hover:!text-[#E5C158] transition-colors inline-block">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-6 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs !text-[#CBD5E1]">
          <p className="!text-[#CBD5E1] !text-xs !mb-0">
            © {new Date().getFullYear()} {store.legalName}. Kanchipuram, India.
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
