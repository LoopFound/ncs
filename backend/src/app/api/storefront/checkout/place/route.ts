import { placeOrderAction } from "@/server/actions/checkout";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** Places an order from the server cart; for RAZORPAY the response carries Checkout options. */
export const POST = storefrontPost("storefront.checkout.place", (body) => placeOrderAction(body));
