export const ENQUIRY_EMAIL = "hello@ncsanthanam.in";

export interface Enquiry {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export function buildEnquiryMailto({ name, email, subject, message }: Enquiry) {
    const body = `${message.trim()}\n\nFrom: ${name.trim()} <${email.trim()}>`;
    return `mailto:${ENQUIRY_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(body)}`;
}
