import { verifyPaymentAction } from "@/server/actions/checkout";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** Called with Razorpay Checkout's success handler payload; the webhook also confirms independently. */
export const POST = storefrontPost("storefront.checkout.verify", (body) =>
  verifyPaymentAction(body as Parameters<typeof verifyPaymentAction>[0]),
);
