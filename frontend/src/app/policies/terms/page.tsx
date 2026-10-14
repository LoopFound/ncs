import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions of Service | NCS Santhanam",
  description: "Terms and conditions governing the purchase and ownership of NCS Santhanam handcrafted silk sarees.",
};

export default function TermsPolicyPage() {
  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Policies</span>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Terms of Service</span>
        </div>

        <div className="mb-12 border-b border-[var(--border)] pb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
            Legal Terms
          </span>
          <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Welcome to NCS Santhanam. By visiting or shopping at our online boutique, you accept the following terms.
          </p>
        </div>

        <div className="space-y-8 text-[var(--text-body)]">
          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">1. Authenticity & Silk Mark Guarantee</h2>
            <p className="text-sm leading-relaxed">
              Every pure silk saree sold by NCS Santhanam bears an authorized <strong>Silk Mark</strong> tag from the Central Silk Board of India. We warrant that our handloom sarees are woven from 100% natural mulberry silk and authentic zari as described.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">2. Color Display & Natural Dye Variations</h2>
            <p className="text-sm leading-relaxed">
              While we capture all photographs under calibrated studio lighting to reflect real silk tones, slight variations in color perception may occur depending on your screen resolution and ambient lighting conditions. Hand-dyed silk threads possess unique natural lustre that shifts subtly with light angle.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">3. Pricing & Taxes</h2>
            <p className="text-sm leading-relaxed">
              All prices shown on the website for deliveries within India include applicable Goods & Services Tax (GST). For international orders, local customs duties or entry charges levied at destination are payable directly by the recipient.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">4. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">
              All imagery, motifs, branding, weave descriptions, and digital assets on this website are the proprietary intellectual property of NCS Santhanam Silks (Est. 1975) and may not be reproduced without written permission.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
