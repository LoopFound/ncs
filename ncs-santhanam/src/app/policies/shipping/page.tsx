import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy | NCS Santhanam",
  description: "Learn about our complimentary insured domestic delivery and worldwide international shipping for authentic Kanchipuram silk sarees.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        {/* Breadcrumb */}
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Policies</span>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Shipping Policy</span>
        </div>

        <div className="mb-12 border-b border-[var(--border)] pb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
            Client Care
          </span>
          <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
            Shipping & Delivery Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Effective as of 2026. Handcrafted with reverence and dispatched with full transit insurance.
          </p>
        </div>

        {/* Content Sections */}
        <div className="prose prose-navy max-w-none space-y-10 text-[var(--text-body)]">
          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              1. Domestic Shipping (Within India)
            </h2>
            <p className="text-sm leading-relaxed mb-4 text-[var(--text-body)]">
              We provide <strong>Complimentary Insured Shipping</strong> on all domestic orders across India. Every parcel is dispatched via trusted premium express courier partners (Blue Dart, DTDC, and Delhivery) in moisture-resistant, tamper-evident archival packaging.
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2 text-[var(--text-body)]/80">
              <li><strong>Dispatch Timeline:</strong> Ready sarees are dispatched within 24 to 48 business hours.</li>
              <li><strong>Delivery Timeline:</strong> Metro cities: 2–4 business days. Non-metro regions: 3–6 business days.</li>
              <li><strong>Customized Sarees:</strong> Sarees requested with fall, pico, or blouse stitching require an additional 3–5 business days before dispatch.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              2. International Worldwide Shipping
            </h2>
            <p className="text-sm leading-relaxed mb-4 text-[var(--text-body)]">
              We proudly ship our authentic Kanchipuram weaves to over 40 countries, including the United States, United Kingdom, Canada, Australia, Singapore, UAE, and the European Union via DHL Express and FedEx.
            </p>
            <ul className="list-disc pl-5 text-sm space-y-2 text-[var(--text-body)]/80">
              <li><strong>Transit Duration:</strong> 5 to 9 business days depending on customs clearance at the destination.</li>
              <li><strong>Customs & Import Duties:</strong> Import duties, VAT, or local taxes (if applicable in the destination country) are the responsibility of the recipient upon arrival.</li>
              <li><strong>Insurance:</strong> Full value transit insurance is included on all international shipments.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              3. Order Tracking & Real-Time Updates
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-body)]">
              As soon as your package departs our Kanchipuram showroom, you will receive an SMS and email notification containing the AWB tracking number and direct live tracking link.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              4. Damaged or Tampered Parcels
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-body)]">
              If the exterior packaging appears visibly damaged, torn, or unsealed upon delivery, please do not accept the package. Take photographs and notify our concierge immediately at <a href="mailto:concierge@ncsanthanam.in" className="text-[var(--gold-text)] font-semibold underline">concierge@ncsanthanam.in</a> or WhatsApp at <a href="https://wa.me/919876543210" className="text-[var(--gold-text)] font-semibold underline">+91 98765 43210</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
