"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { products } from "@/data/mock";
import { buildEnquiryMailto, ENQUIRY_EMAIL } from "@/lib/enquiry";

const fieldClass = "w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors";
const labelClass = "block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2";

export default function ContactForm() {
    const productId = useSearchParams().get("product");
    const product = products.find((p) => p.id === productId);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState(product ? `Enquiry: ${product.name} (${product.id})` : "");
    const [message, setMessage] = useState("");
    const [hasOpenedEmail, setHasOpenedEmail] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = buildEnquiryMailto({ name, email, subject, message });
        setHasOpenedEmail(true);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-[var(--charcoal-light)]">
                This form opens your email app with your message ready to send to {ENQUIRY_EMAIL}.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className={labelClass}>Name</label>
                    <input type="text" id="name" name="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
                </div>
                <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input type="email" id="email" name="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
                </div>
            </div>

            <div>
                <label htmlFor="subject" className={labelClass}>Subject</label>
                <input type="text" id="subject" name="subject" required maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className={fieldClass} />
            </div>

            <div>
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea id="message" name="message" rows={6} required maxLength={1500} value={message} onChange={(e) => setMessage(e.target.value)} className={`${fieldClass} resize-none`}></textarea>
            </div>

            <button type="submit" className="w-full bg-[var(--charcoal)] text-white py-4 text-sm tracking-[0.15em] uppercase hover:bg-black transition-colors">
                Continue in Email App
            </button>

            {hasOpenedEmail && (
                <p role="status" className="text-sm text-[var(--charcoal-light)]">
                    Your message is not sent until you press send in your email app. If no app opened, please email or call us using the details on this page.
                </p>
            )}
        </form>
    );
}
