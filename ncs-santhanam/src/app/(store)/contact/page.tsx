import type { Metadata } from "next";
import { getStoreInfo, whatsappLink } from "@/server/services/content";
import ContactForm from "@/components/ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Contact & Showroom",
  description: "Visit the NCS Santhanam showroom in Kancheepuram or send our concierge a message.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const store = await getStoreInfo();
  const wa = whatsappLink(store, "Hello NCS Santhanam!");
  const mapQuery = encodeURIComponent(`${store.addressLine}, ${store.city}, ${store.state} ${store.pincode}`);

  return (
    <div className="pt-28 lg:pt-36 pb-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-4">Get in touch</span>
            <h1 className="font-serif !text-5xl lg:!text-6xl font-light text-[var(--charcoal)] mb-8">
              Visit Our <br />
              <span className="italic">Showroom</span>
            </h1>

            <dl className="space-y-8 mb-12">
              <div>
                <dt className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Address</dt>
                <dd className="text-[var(--charcoal-light)] leading-relaxed">
                  <address className="not-italic">
                    {store.addressLine},<br />
                    {store.city}, {store.state} – {store.pincode}
                  </address>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-sm underline text-[var(--gold-text)]">
                    Open in Google Maps
                  </a>
                </dd>
              </div>
              {(store.phone || store.supportEmail || wa) && (
                <div>
                  <dt className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Contact</dt>
                  <dd className="text-[var(--charcoal-light)] space-y-1">
                    {store.phone && (
                      <p className="!mb-0">
                        <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hover:text-[var(--gold-text)]">
                          {store.phone}
                        </a>
                      </p>
                    )}
                    {store.supportEmail && (
                      <p className="!mb-0">
                        <a href={`mailto:${store.supportEmail}`} className="hover:text-[var(--gold-text)]">
                          {store.supportEmail}
                        </a>
                      </p>
                    )}
                    {wa && (
                      <p className="!mb-0">
                        <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold-text)]">
                          WhatsApp & video shopping
                        </a>
                      </p>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-[var(--charcoal)] mb-2 uppercase tracking-wider text-sm">Hours</dt>
                <dd className="text-[var(--charcoal-light)]">{store.hours}</dd>
              </div>
            </dl>

            <div className="aspect-video relative overflow-hidden border border-[var(--border)] bg-[var(--greige)]">
              <iframe
                title="Showroom location"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="absolute inset-0 w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <div className="bg-[var(--cream)] p-8 lg:p-12 border border-[var(--border)]">
            <h2 className="font-serif !text-3xl text-[var(--charcoal)] mb-8">Send us a message</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
