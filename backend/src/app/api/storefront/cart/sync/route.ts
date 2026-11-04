import { z } from "zod";
import { run } from "@/server/actions/result";
import { rateLimit, RateLimitError } from "@/server/rate-limit";
import { assertUser } from "@/server/session";
import { syncStorefrontCart } from "@/server/services/storefront";
import { storefrontPost } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

const syncInput = z.object({
  items: z
    .array(
      z.object({
        slug: z.string().trim().toLowerCase().min(1).max(160),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .max(50, "Your bag can hold up to 50 different items."),
});

/** Replaces the signed-in customer's server cart with the storefront's cart (by product slug). */
export const POST = storefrontPost("storefront.cart.sync", (body) =>
  run("storefront.cart.sync", async () => {
    const user = await assertUser();
    const rl = await rateLimit("cart-sync", user.id, 30, 60);
    if (!rl.ok) throw new RateLimitError("You are updating your bag too quickly. Please wait a moment.", rl.retryAfterSeconds);
    const { items } = syncInput.parse(body);
    return syncStorefrontCart(user.id, items);
  }),
);
