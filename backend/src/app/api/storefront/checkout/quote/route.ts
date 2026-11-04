import { quoteCheckoutAction } from "@/server/actions/checkout";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** Prices the signed-in customer's server cart (sync it first via /api/storefront/cart/sync). */
export const POST = storefrontPost("storefront.checkout.quote", (body) =>
  quoteCheckoutAction(body as Parameters<typeof quoteCheckoutAction>[0]),
);
