import { submitContactAction } from "@/server/actions/engagement";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

export const POST = storefrontPost("storefront.contact", (body) => submitContactAction(body));
