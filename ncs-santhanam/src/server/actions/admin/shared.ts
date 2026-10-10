import { z } from "zod";
import { assertStaff, type SessionUser } from "../../session";
import { run, type ActionResult } from "../result";

/** Runs an admin action after checking the caller's role. */
export function adminRun<T>(name: string, minimum: "staff" | "admin", fn: (actor: SessionUser) => Promise<T>): Promise<ActionResult<T>> {
  return run(`admin.${name}`, async () => fn(await assertStaff(minimum)));
}

export const id = z.string().min(1).max(64);

/** Optional trimmed text: "" → null. */
export const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

/** Multi-line textarea → string[] (one entry per non-empty line). */
export const lines = (maxItems = 50) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, maxItems),
    );

/** Rupee amount typed in a form → integer paise. */
export const rupees = z.coerce
  .number({ error: "Enter an amount" })
  .min(0)
  .max(10_000_000)
  .transform((r) => Math.round(r * 100));

export const optRupees = z
  .union([z.literal(""), z.coerce.number().min(0).max(10_000_000)])
  .optional()
  .transform((v) => (v === "" || v == null ? null : Math.round(Number(v) * 100)));

/** "5" (percent) → 500 bps. */
export const percentToBps = z.coerce
  .number()
  .min(0)
  .max(28)
  .transform((p) => Math.round(p * 100));

export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === "on" || v === "true" || v === true);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const formObject = (fd: FormData) => Object.fromEntries(fd.entries());
