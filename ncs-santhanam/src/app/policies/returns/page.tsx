import Link from "next/link";

export const metadata = {
  title: "Returns & Exchange Policy | NCS Santhanam",
  description: "Read our transparent 7-day returns, exchange, and cancellation policy for pure Kanchipuram silk sarees.",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        {/* Breadcrumb */}
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Policies</span>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Returns & Exchange</span>
        </div>

        <div className="mb-12 border-b border-[var(--border)] pb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
            Client Care
          </span>
          <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
            Returns, Exchanges & Cancellation
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Our goal is your complete delight with each handwoven treasure.
          </p>
        </div>

        <div className="prose prose-navy max-w-none space-y-10 text-[var(--text-body)]">
          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              1. 7-Day Hassle-Free Exchange Window
            </h2>
            <p className="text-sm leading-relaxed mb-4 text-[var(--text-body)]">
              We offer a straightforward <strong>7-day exchange policy</strong> from the date of package delivery. If you wish to exchange your saree for another color, weave, or design, we will happily facilitate the process.
            </p>
            <div className="p-4 bg-amber-50/70 border border-amber-200/60 rounded text-xs text-amber-900 leading-relaxed">
              <strong>Condition for Eligibility:</strong> The saree must be in its original pristine condition, unwashed, unworn, in original folds, with all original tags (including the <em>Silk Mark</em> authentication tag) intact.
            </div>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              2. Non-Returnable & Non-Exchangeable Items
            </h2>
            <ul className="list-disc pl-5 text-sm space-y-2 text-[var(--text-body)]/80">
              <li>Sarees where custom services (blouse fabric detachment, blouse tailoring, fall & pico stitching, or tassel finishing) have already been performed upon customer request.</li>
              <li>Sarees purchased during rare clearance, archived sample sales, or customized bridal weaves.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              3. Handloom Nuances vs. Manufacturing Defects
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-body)]">
              Authentic Kanchipuram sarees are handwoven by human master weavers on wooden pit looms. Minor inconsistencies in thread tension, slubs, slight dye variations, or weft spacing are hallmark traits of authentic handloom artistry and are not considered manufacturing defects.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-4">
              4. How to Initiate an Exchange or Return
            </h2>
            <p className="text-sm leading-relaxed mb-4 text-[var(--text-body)]">
              Please email us at <a href="mailto:concierge@ncsanthanam.in" className="text-[var(--gold-text)] font-semibold underline">concierge@ncsanthanam.in</a> or message our WhatsApp team at <a href="https://wa.me/919876543210" className="text-[var(--gold-text)] font-semibold underline">+91 98765 43210</a> with your Order ID and reason for return. Our team will arrange a reverse pickup from your address.
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-body)]">
              Refunds (where applicable) are processed back to the original payment method within 5–7 business days after inspection at our Kanchipuram atelier.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
