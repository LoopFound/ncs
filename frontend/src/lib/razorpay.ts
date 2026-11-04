import type { RazorpayParams, RazorpayPaymentResponse } from "@/lib/api";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayFailure {
    error?: { description?: string; reason?: string };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    handler: (response: RazorpayPaymentResponse) => void;
    modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

let loading: Promise<boolean> | null = null;

/** Loads Razorpay Checkout once; resolves false if the script can't be fetched. */
export function loadRazorpay(): Promise<boolean> {
    if (typeof window === "undefined") return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);
    if (loading) return loading;

    loading = new Promise<boolean>((resolve) => {
        const script = document.createElement("script");
        script.src = CHECKOUT_SRC;
        script.async = true;
        script.onload = () => resolve(Boolean(window.Razorpay));
        script.onerror = () => {
            script.remove();
            loading = null;
            resolve(false);
        };
        document.body.appendChild(script);
    });
    return loading;
}

export type RazorpayOutcome =
    | { status: "paid"; response: RazorpayPaymentResponse }
    | { status: "dismissed" }
    | { status: "unavailable" };

/**
 * Opens Razorpay Checkout for a server-created order and resolves once the customer pays
 * or closes the window. Payment failures inside the window are reported through onFailure;
 * Razorpay lets the customer retry there, so they don't end the flow.
 */
export async function payWithRazorpay(
    params: RazorpayParams,
    onFailure: (message: string) => void,
): Promise<RazorpayOutcome> {
    if (!(await loadRazorpay()) || !window.Razorpay) return { status: "unavailable" };
    const Razorpay = window.Razorpay;

    return new Promise<RazorpayOutcome>((resolve) => {
        const rzp = new Razorpay({
            key: params.keyId,
            amount: params.amount,
            currency: params.currency,
            order_id: params.orderId,
            name: "NCS Santhanam",
            description: "Kanchipuram silk order",
            prefill: params.prefill,
            theme: { color: "#0B1B4D" },
            handler: (response) => resolve({ status: "paid", response }),
            modal: { ondismiss: () => resolve({ status: "dismissed" }) },
        });
        rzp.on("payment.failed", (response) => {
            onFailure(response.error?.description || "The payment did not go through. You can try again.");
        });
        rzp.open();
    });
}
