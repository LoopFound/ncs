"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { products } from "@/data/mock";
import { sendContactMessage } from "@/lib/api";
import { CONTACT_LIMITS, ENQUIRY_EMAIL, validateEnquiry, type Enquiry } from "@/lib/enquiry";

const fieldClass = "w-full bg-white border border-[var(--border)] px-4 py-3 text-[var(--charcoal)] focus:outline-none focus:border-[var(--gold)] transition-colors";
const labelClass = "block text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-2";
const errorTextClass = "mt-1 text-xs text-[var(--maroon)]";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "failed"; error: string };

export default function ContactForm() {
    const productId = useSearchParams().get("product");
    const product = products.find((p) => p.id === productId);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState(product ? `Enquiry: ${product.name} (${product.id})` : "");
    const [message, setMessage] = useState("");
    const [website, setWebsite] = useState("");
    const [errors, setErrors] = useState<Partial<Record<keyof Enquiry, string>>>({});
    const [status, setStatus] = useState<Status>({ kind: "idle" });

    const isSending = status.kind === "sending";

    const clearError = (field: keyof Enquiry) => {
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSending) return;

        const enquiry = { name, email, subject, message };
        const clientErrors = validateEnquiry(enquiry);
        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            setStatus({ kind: "failed", error: "Please check the highlighted fields." });
            return;
        }

        setErrors({});
        setStatus({ kind: "sending" });
        const result = await sendContactMessage({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim(),
            website,
        });

        if (!result.ok) {
            // Keep everything the customer typed so they can retry.
            const fields = result.fields ?? {};
            setErrors({ name: fields.name, email: fields.email, subject: fields.subject, message: fields.message });
            setStatus({ kind: "failed", error: result.error });
            return;
        }

        setStatus({ kind: "sent", email: email.trim() });
        setSubject("");
        setMessage("");
    };

    const describedBy = (field: keyof Enquiry) => (errors[field] ? `contact-${field}-error` : undefined);

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className={labelClass}>Name</label>
                    <input type="text" id="name" name="name" required minLength={CONTACT_LIMITS.name[0]} maxLength={CONTACT_LIMITS.name[1]} autoComplete="name" value={name} onChange={(e) => { setName(e.target.value); clearError("name"); }} aria-invalid={errors.name ? true : undefined} aria-describedby={describedBy("name")} className={fieldClass} />
                    {errors.name && <p id="contact-name-error" className={errorTextClass}>{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input type="email" id="email" name="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError("email"); }} aria-invalid={errors.email ? true : undefined} aria-describedby={describedBy("email")} className={fieldClass} />
                    {errors.email && <p id="contact-email-error" className={errorTextClass}>{errors.email}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="subject" className={labelClass}>Subject</label>
                <input type="text" id="subject" name="subject" required minLength={CONTACT_LIMITS.subject[0]} maxLength={CONTACT_LIMITS.subject[1]} value={subject} onChange={(e) => { setSubject(e.target.value); clearError("subject"); }} aria-invalid={errors.subject ? true : undefined} aria-describedby={describedBy("subject")} className={fieldClass} />
                {errors.subject && <p id="contact-subject-error" className={errorTextClass}>{errors.subject}</p>}
            </div>

            <div>
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea id="message" name="message" rows={6} required minLength={CONTACT_LIMITS.message[0]} maxLength={CONTACT_LIMITS.message[1]} value={message} onChange={(e) => { setMessage(e.target.value); clearError("message"); }} aria-invalid={errors.message ? true : undefined} aria-describedby={describedBy("message")} className={`${fieldClass} resize-none`}></textarea>
                {errors.message && <p id="contact-message-error" className={errorTextClass}>{errors.message}</p>}
            </div>

            {/* Honeypot: hidden from people, left empty by them; bots tend to fill it. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor="website">Website</label>
                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            <button type="submit" disabled={isSending} className="w-full bg-[var(--charcoal)] text-white py-4 text-sm tracking-[0.15em] uppercase hover:bg-black transition-colors disabled:cursor-wait disabled:opacity-70">
                {isSending ? "Sending..." : "Send Message"}
            </button>

            {status.kind === "sent" && (
                <p role="status" className="text-sm text-emerald-700">
                    Thank you. Your message has reached our atelier and we&apos;ll reply to {status.email}.
                </p>
            )}
            {status.kind === "failed" && (
                <p role="alert" className="text-sm text-[var(--maroon)]">
                    Your message was not sent. {status.error}
                </p>
            )}

            <p className="text-sm text-[var(--charcoal-light)]">
                Prefer email? Write to us at{" "}
                <a href={`mailto:${ENQUIRY_EMAIL}`} className="underline underline-offset-4 hover:text-[var(--gold-text)]">{ENQUIRY_EMAIL}</a>.
            </p>
        </form>
    );
}
