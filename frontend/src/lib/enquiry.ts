export const ENQUIRY_EMAIL = "hello@ncsanthanam.in";

export interface Enquiry {
    name: string;
    email: string;
    subject: string;
    message: string;
}

// Limits mirror backend contactSchema; the server always re-validates.
export const CONTACT_LIMITS = {
    name: [2, 80],
    subject: [3, 150],
    message: [10, 4000],
} as const;

const LABELS = { name: "Name", subject: "Subject", message: "Message" } as const;

export function validateEnquiry(enquiry: Enquiry): Partial<Record<keyof Enquiry, string>> {
    const errors: Partial<Record<keyof Enquiry, string>> = {};
    for (const key of ["name", "subject", "message"] as const) {
        const [min, max] = CONTACT_LIMITS[key];
        const length = enquiry[key].trim().length;
        if (length < min) errors[key] = length === 0 ? `${LABELS[key]} is required` : `${LABELS[key]} must be at least ${min} characters`;
        else if (length > max) errors[key] = `${LABELS[key]} is too long`;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email.trim())) errors.email = "Enter a valid email";
    return errors;
}
