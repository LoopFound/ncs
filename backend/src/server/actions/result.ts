import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";
import { logger, errorInfo } from "../logger";
import { AuthError } from "../session";
import { CartError } from "../services/cart";
import { CheckoutError } from "../services/checkout";
import { CouponError } from "../services/coupons";
import { OrderError } from "../services/orders";
import { OutOfStockError } from "../services/inventory";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fields?: Record<string, string> };

const EXPECTED = [AuthError, CartError, CheckoutError, CouponError, OrderError, OutOfStockError];

/** Runs a server action body, converting known errors into user-facing results. */
export async function run<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (err instanceof ZodError) return { ok: false, error: "Please check the highlighted fields.", fields: fieldErrors(err) };
    if (EXPECTED.some((E) => err instanceof E)) {
      const field = err instanceof CheckoutError ? err.field : undefined;
      return { ok: false, error: (err as Error).message, fields: field ? { [field]: (err as Error).message } : undefined };
    }
    // Next.js uses thrown errors for redirect()/notFound(); let those through.
    if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_")) throw err;
    logger.error({ ...errorInfo(err), action: name }, "server action failed");
    return { ok: false, error: "Something went wrong on our side. Please try again." };
  }
}
