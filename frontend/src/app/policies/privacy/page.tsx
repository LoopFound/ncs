import Link from "next/link";

export const metadata = {
  title: "Privacy & Data Protection Policy | NCS Santhanam",
  description: "Learn how NCS Santhanam protects your personal data, payment security, and digital privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-28 lg:pt-36 pb-24 bg-[var(--cream)]">
      <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--navy)]/60 mb-6">
          <Link href="/" className="hover:text-[var(--gold)]">Home</Link>
          <span className="mx-2">/</span>
          <span>Policies</span>
          <span className="mx-2">/</span>
          <span className="text-[var(--navy)]">Privacy Policy</span>
        </div>

        <div className="mb-12 border-b border-[var(--border)] pb-8">
          <span className="text-xs uppercase tracking-[0.3em] text-[var(--gold-text)] font-semibold block mb-2">
            Legal & Security
          </span>
          <h1 className="font-[var(--font-serif)] text-4xl sm:text-5xl text-[var(--navy)] mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            We value your trust. We strictly safeguard your personal details and never monetize your information.
          </p>
        </div>

        <div className="space-y-8 text-[var(--text-body)]">
          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed mb-3">
              When you browse our online boutique, register an account, or place an order, we collect essential details necessary to fulfill your request:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-1 text-[var(--text-body)]/80">
              <li>Full Name, Shipping Address, and Billing Address.</li>
              <li>Contact details: Email address and telephone/WhatsApp number.</li>
              <li>Order history and communication transcripts with our concierge.</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">2. Payment Security & Encryption</h2>
            <p className="text-sm leading-relaxed">
              We <strong>do not store</strong> your credit card, debit card numbers, or CVV codes on our servers. All financial transactions are processed through PCI-DSS Level 1 certified gateways (Razorpay, Stripe) with 256-bit SSL encryption.
            </p>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">3. How Your Data Is Utilized</h2>
            <p className="text-sm leading-relaxed mb-3">Your information is used strictly for:</p>
            <ul className="list-disc pl-5 text-sm space-y-1 text-[var(--text-body)]/80">
              <li>Order fulfillment, courier delivery, and AWB tracking updates.</li>
              <li>Customer service assistance, wedding consultations, and returns management.</li>
              <li>Sending exclusive invitations to &quot;The Silk Circle&quot; (only if explicitly opted-in).</li>
            </ul>
          </section>

          <section className="bg-white p-8 rounded-xl border border-[var(--border)] shadow-xs">
            <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-3">4. Contacting Our Data Officer</h2>
            <p className="text-sm leading-relaxed">
              For any questions regarding your personal information, or to request deletion of your account records, write to us at <a href="mailto:privacy@ncsanthanam.in" className="text-[var(--gold-text)] font-semibold underline">privacy@ncsanthanam.in</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
