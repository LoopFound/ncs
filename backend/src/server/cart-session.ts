import { cookies } from "next/headers";
import { getCurrentUser } from "./session";
import { mergeAnonymousCart, type CartIdentity } from "./services/cart";
import { logger, errorInfo } from "./logger";

const CART_COOKIE = "ncs_cart";

/**
 * Works out whose cart this request uses. When a signed-in customer still has an
 * anonymous cart cookie, that cart is merged into their account cart.
 * Pass `mutable: true` from server actions / route handlers so the cookie can be cleared.
 */
export async function resolveCartIdentity({ mutable = false } = {}): Promise<CartIdentity> {
  const [user, jar] = await Promise.all([getCurrentUser(), cookies()]);
  const anonymousId = jar.get(CART_COOKIE)?.value ?? null;
  if (user) {
    if (anonymousId) {
      try {
        await mergeAnonymousCart(user.id, anonymousId);
        if (mutable) jar.delete(CART_COOKIE);
      } catch (err) {
        logger.warn({ ...errorInfo(err), userId: user.id }, "cart merge failed");
      }
    }
    return { userId: user.id, anonymousId: null };
  }
  return { userId: null, anonymousId };
}

export async function persistAnonymousCartId(anonymousId: string | null) {
  if (!anonymousId) return;
  const jar = await cookies();
  if (jar.get(CART_COOKIE)?.value === anonymousId) return;
  jar.set(CART_COOKIE, anonymousId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
