import { run } from "@/server/actions/result";
import { assertUser } from "@/server/session";
import { listStorefrontOrders } from "@/server/services/storefront";
import { storefrontGet } from "@/server/storefront-http";

export const dynamic = "force-dynamic";

/** The signed-in customer's recent orders (newest first, up to 100). */
export const GET = storefrontGet("storefront.orders", () =>
  run("storefront.orders", async () => ({ orders: await listStorefrontOrders((await assertUser()).id) })),
);
