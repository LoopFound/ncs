import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";
import { logger, errorInfo } from "../logger";
import { RateLimitError } from "../rate-limit";
import { AuthError } from "../session";
import { CartError } from "../services/cart";
import { CheckoutError } from "../services/checkout";
import { CouponError } from "../services/coupons";
import { OrderError } from "../services/orders";
import { OutOfStockError } from "../services/inventory";

/** Machine-readable failure category, used to pick an HTTP status for the storefront API. */
export type ActionErrorCode = "INVALID" | "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "INTERNAL";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fields?: Record<string, string>; code?: ActionErrorCode };

export const GENERIC_ERROR = "Something went wrong on our side. Please try again.";

const EXPECTED = [CartError, CheckoutError, CouponError, OrderError, OutOfStockError];

/** Runs a server action body, converting known errors into user-facing results. */
export async function run<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (err instanceof ZodError) {
      return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(err), code: "INVALID" };
    }
    if (err instanceof AuthError) {
      return { ok: false, error: err.message, code: err.reason === "forbidden" ? "FORBIDDEN" : "UNAUTHENTICATED" };
    }
    if (err instanceof RateLimitError) return { ok: false, error: err.message, code: "RATE_LIMITED" };
    if (EXPECTED.some((E) => err instanceof E)) {
      const field = err instanceof CheckoutError ? err.field : undefined;
      return {
        ok: false,
        error: (err as Error).message,
        fields: field ? { [field]: (err as Error).message } : undefined,
        code: "INVALID",
      };
    }
    // Next.js uses thrown errors for redirect()/notFound(); let those through.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    logger.error({ ...errorInfo(err), action: name }, "server action failed");
    return { ok: false, error: GENERIC_ERROR, code: "INTERNAL" };
  }
}
