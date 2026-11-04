import { run } from "@/server/actions/result";
import { getCurrentUser } from "@/server/session";
import { toStorefrontUser } from "@/server/services/storefront";
import { storefrontGet } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** Who is signed in. Always 200: `{ user: null }` when signed out. */
export const GET = storefrontGet("storefront.session", () =>
  run("storefront.session", async () => {
    const user = await getCurrentUser();
    return { user: user ? toStorefrontUser(user) : null };
  }),
);
