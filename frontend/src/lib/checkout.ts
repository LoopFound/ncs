import type { CartItem } from "@/context/CartContext";
import { products } from "@/data/mock";
import type { CartSyncItem, PaymentMethod, PlaceOrderInput } from "@/lib/api";

// Must match backend/src/lib/india.ts exactly; the server validates the state against this list.
export const INDIAN_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
] as const;

export const MAX_LINE_QUANTITY = 10;
export const MAX_SYNC_ITEMS = 50;

const SLUG_BY_ID = new Map(products.map((p) => [p.id, p.slug]));

export interface CartSyncPayload {
    items: CartSyncItem[];
    /** Cart item ids that are not in the storefront catalogue. */
    unknownIds: string[];
    /** Item ids whose quantity was reduced to the per-line maximum. */
    cappedIds: string[];
}

/** Maps the saved cart (storefront ids like "p1") to the backend's product slugs. */
export function cartToSyncPayload(cartItems: Pick<CartItem, "id" | "quantity">[]): CartSyncPayload {
    const quantities = new Map<string, number>();
    const unknownIds: string[] = [];
    const cappedIds: string[] = [];

    for (const item of cartItems) {
        const slug = SLUG_BY_ID.get(item.id);
        if (!slug) {
            if (!unknownIds.includes(item.id)) unknownIds.push(item.id);
            continue;
        }
        quantities.set(slug, (quantities.get(slug) ?? 0) + item.quantity);
    }

    const items: CartSyncItem[] = [];
    for (const [slug, quantity] of quantities) {
        if (quantity > MAX_LINE_QUANTITY) {
            const id = cartItems.find((i) => SLUG_BY_ID.get(i.id) === slug)?.id;
            if (id) cappedIds.push(id);
        }
        items.push({ slug, quantity: Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity))) });
    }

    return { items: items.slice(0, MAX_SYNC_ITEMS), unknownIds, cappedIds };
}

/** Mirrors backend `indianMobile`: returns +91XXXXXXXXXX, or null when invalid. */
export function toIndianE164(raw: string): string | null {
    const v = raw.trim().replace(/[\s-]/g, "");
    if (!/^(\+91|91|0)?[6-9]\d{9}$/.test(v)) return null;
    return `+91${v.slice(-10)}`;
}

export function isValidPincode(raw: string): boolean {
    return /^[1-9]\d{5}$/.test(raw.trim());
}

export function formatINR(paise: number): string {
    return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export type UiPaymentMethod = "upi" | "card" | "cod";

export function toPaymentMethod(method: UiPaymentMethod): PaymentMethod {
    return method === "cod" ? "COD" : "RAZORPAY";
}

export interface CheckoutForm {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    addFallPico: boolean;
    giftWrap: boolean;
    giftMessage: string;
    paymentMethod: UiPaymentMethod;
}

// Backend field paths (from checkoutSchema) → checkout form fields.
const FIELD_MAP: Record<string, keyof CheckoutForm> = {
    "address.fullName": "fullName",
    "address.phone": "phone",
    "address.line1": "address",
    "address.city": "city",
    "address.state": "state",
    "address.pincode": "pincode",
    email: "email",
    paymentMethod: "paymentMethod",
    giftMessage: "giftMessage",
};

/** Splits server field errors into ones we can show next to an input and the rest. */
export function mapCheckoutFieldErrors(fields: Record<string, string> | undefined) {
    const byField: Partial<Record<keyof CheckoutForm, string>> = {};
    const other: string[] = [];
    for (const [key, message] of Object.entries(fields ?? {})) {
        const field = FIELD_MAP[key];
        if (field) byField[field] ??= message;
        else if (!other.includes(message)) other.push(message);
    }
    return { byField, other };
}

/** Client-side checks that mirror checkoutSchema; the server always re-validates. */
export function validateCheckoutForm(form: CheckoutForm): Partial<Record<keyof CheckoutForm, string>> {
    const errors: Partial<Record<keyof CheckoutForm, string>> = {};
    const len = (v: string) => v.trim().length;
    if (len(form.fullName) < 2) errors.fullName = "Full name is required";
    else if (len(form.fullName) > 80) errors.fullName = "Full name is too long";
    if (!toIndianE164(form.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email";
    if (len(form.address) < 3) errors.address = "Address is required";
    else if (len(form.address) > 120) errors.address = "Address is too long";
    if (len(form.city) < 2) errors.city = "City is required";
    else if (len(form.city) > 60) errors.city = "City is too long";
    if (!(INDIAN_STATES as readonly string[]).includes(form.state)) errors.state = "Choose a state";
    if (!isValidPincode(form.pincode)) errors.pincode = "Enter a valid 6-digit PIN code";
    return errors;
}

export function buildPlaceOrderInput(form: CheckoutForm, couponCode: string): PlaceOrderInput {
    const giftMessage = form.giftWrap ? form.giftMessage.trim() : "";
    return {
        address: {
            fullName: form.fullName.trim(),
            phone: toIndianE164(form.phone) ?? form.phone.trim(),
            line1: form.address.trim(),
            city: form.city.trim(),
            state: form.state,
            pincode: form.pincode.trim(),
        },
        email: form.email.trim() || undefined,
        paymentMethod: toPaymentMethod(form.paymentMethod),
        couponCode: couponCode.trim() || undefined,
        addFallPico: form.addFallPico,
        giftWrap: form.giftWrap,
        giftMessage: giftMessage || undefined,
        saveAddress: true,
    };
}
