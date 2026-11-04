import { subscribeNewsletterAction } from "@/server/actions/engagement";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** Double opt-in: always `{ ok: true }` for a valid address (membership is never revealed). */
export const POST = storefrontPost("storefront.newsletter", (body) =>
  subscribeNewsletterAction(typeof body.email === "string" ? body.email : ""),
);
