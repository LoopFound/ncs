// Typed client for the storefront API. Every call is same-origin (/api/*); next.config.ts
// proxies it to the backend, so Better Auth cookies stay on this host.
// Amounts in responses are integer paise.

export type ActionResult<T = undefined> =
    | { ok: true; data: T }
    | { ok: false; error: string; fields?: Record<string, string>; status?: number; code?: string };

export const NETWORK_ERROR = "Network error. Please check your connection and try again.";

const STATUS_MESSAGES: Record<number, string> = {
    401: "Please sign in to continue.",
    403: "This request was blocked. Please refresh the page and try again.",
    404: "This service is not available right now. Please try again shortly.",
    429: "Too many attempts. Please wait a minute and try again.",
};
const SERVER_ERROR = "Something went wrong on our side. Please try again.";

export function statusMessage(status: number): string {
    return STATUS_MESSAGES[status] ?? SERVER_ERROR;
}

type Fetcher = typeof fetch;

// Listeners told when a storefront route answers 401, so the session UI can flip to signed out.
const unauthorizedListeners = new Set<() => void>();

export function onUnauthorized(listener: () => void): () => void {
    unauthorizedListeners.add(listener);
    return () => {
        unauthorizedListeners.delete(listener);
    };
}

function notifyUnauthorized() {
    for (const listener of unauthorizedListeners) listener();
}

interface RequestOptions {
    method?: "GET" | "POST";
    body?: unknown;
    fetcher?: Fetcher;
}

async function send(path: string, { method = "GET", body, fetcher }: RequestOptions) {
    const doFetch = fetcher ?? fetch;
    const res = await doFetch(path, {
        method,
        credentials: "same-origin",
        cache: "no-store",
        headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: unknown = null;
    try {
        json = await res.json();
    } catch {
        // Non-JSON (an HTML error page from a proxy, an empty body): fall back to the status.
    }
    return { res, json };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFields(value: unknown): Record<string, string> | undefined {
    if (!isRecord(value)) return undefined;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) if (typeof v === "string") out[k] = v;
    return Object.keys(out).length ? out : undefined;
}

/** Calls a storefront route that answers with the backend ActionResult shape. */
export async function apiRequest<T = undefined>(path: string, options: RequestOptions = {}): Promise<ActionResult<T>> {
    let res: Response;
    let json: unknown;
    try {
        ({ res, json } = await send(path, options));
    } catch {
        return { ok: false, error: NETWORK_ERROR };
    }

    if (res.status === 401) notifyUnauthorized();

    if (isRecord(json) && typeof json.ok === "boolean") {
        if (json.ok && res.ok) return { ok: true, data: json.data as T };
        if (!json.ok) {
            return {
                ok: false,
                error: typeof json.error === "string" && json.error ? json.error : statusMessage(res.status),
                fields: stringFields(json.fields),
                status: res.status,
            };
        }
    }
    return { ok: false, error: statusMessage(res.status), status: res.status };
}

/** Calls a Better Auth endpoint, which returns its own JSON (`{ code, message }` on error). */
export async function authRequest<T = unknown>(path: string, body: unknown, fetcher?: Fetcher): Promise<ActionResult<T>> {
    let res: Response;
    let json: unknown;
    try {
        ({ res, json } = await send(path, { method: "POST", body, fetcher }));
    } catch {
        return { ok: false, error: NETWORK_ERROR };
    }
    if (res.ok) return { ok: true, data: json as T };
    const message = isRecord(json) && typeof json.message === "string" && json.message ? json.message : statusMessage(res.status);
    const code = isRecord(json) && typeof json.code === "string" ? json.code : undefined;
    return { ok: false, error: message, status: res.status, code };
}

// ---------- Storefront routes ----------

export interface StorefrontUser {
    id: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    phoneNumberVerified: boolean;
    emailVerified: boolean;
}

export interface CartSyncItem {
    slug: string;
    quantity: number;
}

export interface CartSyncResult {
    lines: { slug: string; name: string; quantity: number; unitPrice: number; lineTotal: number; image: string | null }[];
    missing: string[];
    warnings: string[];
}

export type PaymentMethod = "RAZORPAY" | "COD";

export interface CheckoutQuote {
    totals: {
        subtotal: number;
        discountTotal: number;
        shippingTotal: number;
        codFee: number;
        taxTotal: number;
        grandTotal: number;
    };
    lines: { variantId: string; name: string; image: string | null; quantity: number; lineTotal: number }[];
    shipping: { etaMinDays: number; etaMaxDays: number; codAvailable: boolean } | null;
    couponCode: string | null;
    couponError: string | null;
    codAllowed: boolean;
    codReason: string | null;
    razorpayEnabled: boolean;
}

export interface CheckoutAddress {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
}

export interface PlaceOrderInput {
    address: CheckoutAddress;
    email?: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    addFallPico: boolean;
    giftWrap: boolean;
    giftMessage?: string;
    customerNote?: string;
    saveAddress?: boolean;
}

export interface RazorpayParams {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    prefill: { name: string; email?: string; contact: string };
}

export interface PlacedOrder {
    orderId: string;
    number: string;
    paymentMethod: PaymentMethod;
    razorpay?: RazorpayParams;
}

export interface RazorpayPaymentResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface StorefrontOrder {
    id: string;
    number: string;
    status: string;
    paymentStatus: string;
    paymentMethod: PaymentMethod;
    grandTotal: number;
    placedAt: string;
    items: { productName: string; quantity: number }[];
}

export interface ContactInput {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    website?: string;
}

export const getSession = () => apiRequest<{ user: StorefrontUser | null }>("/api/storefront/session");
export const syncCart = (items: CartSyncItem[]) =>
    apiRequest<CartSyncResult>("/api/storefront/cart/sync", { method: "POST", body: { items } });
export const quoteCheckout = (input: { pincode?: string; couponCode?: string; paymentMethod?: PaymentMethod }) =>
    apiRequest<CheckoutQuote>("/api/storefront/checkout/quote", { method: "POST", body: input });
export const placeOrder = (input: PlaceOrderInput) =>
    apiRequest<PlacedOrder>("/api/storefront/checkout/place", { method: "POST", body: input });
/** `status` is the order's status after verification: a late payment can be verified yet refunded (CANCELLED). */
export interface VerifiedPayment {
    orderId: string;
    number: string;
    status: string;
}

export const verifyPayment = (input: RazorpayPaymentResponse) =>
    apiRequest<VerifiedPayment>("/api/storefront/checkout/verify", { method: "POST", body: input });
export const getOrders = () => apiRequest<{ orders: StorefrontOrder[] }>("/api/storefront/orders");
export const sendContactMessage = (input: ContactInput) =>
    apiRequest("/api/storefront/contact", { method: "POST", body: input });
export const subscribeNewsletter = (email: string) =>
    apiRequest("/api/storefront/newsletter", { method: "POST", body: { email } });

// ---------- Better Auth ----------

export const signInWithEmail = (input: { email: string; password: string }) => authRequest("/api/auth/sign-in/email", input);
export const signUpWithEmail = (input: { name: string; email: string; password: string; callbackURL?: string }) =>
    authRequest("/api/auth/sign-up/email", input);
export const resendVerificationEmail = (input: { email: string; callbackURL?: string }) =>
    authRequest("/api/auth/send-verification-email", input);
export const requestPasswordReset = (input: { email: string; redirectTo: string }) =>
    authRequest("/api/auth/request-password-reset", input);
export const sendPhoneOtp = (phoneNumber: string) => authRequest("/api/auth/phone-number/send-otp", { phoneNumber });
export const verifyPhoneOtp = (input: { phoneNumber: string; code: string }) => authRequest("/api/auth/phone-number/verify", input);
export const signOut = () => authRequest("/api/auth/sign-out", {});
