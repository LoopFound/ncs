"use client";

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email?: string; contact: string };
  theme: { color: string };
  handler: (res: RazorpaySuccess) => void;
  modal: { ondismiss: () => void; escape: boolean; confirm_close: boolean };
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open: () => void; on: (event: string, cb: (e: unknown) => void) => void };
  }
}

let loader: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  loader ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("Could not load Razorpay"));
    };
    document.body.appendChild(s);
  });
  return loader;
}

/** Opens Razorpay Checkout; resolves with the signed result or null if the customer closed it. */
export async function payWithRazorpay(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  prefill: { name: string; email?: string; contact: string };
}): Promise<RazorpaySuccess | null> {
  await loadRazorpay();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: "NCS Santhanam",
      description: opts.description,
      prefill: opts.prefill,
      theme: { color: "#0B1B4D" },
      handler: (res) => resolve(res),
      modal: { ondismiss: () => resolve(null), escape: true, confirm_close: true },
    });
    rzp.open();
  });
}
