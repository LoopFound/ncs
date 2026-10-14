// Input schemas shared by client forms and server actions (the server always re-validates).
import { z } from "zod";
import { INDIAN_STATES } from "./india";

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} is too long`);

export const indianMobile = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(\+91|91|0)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number")
  .transform((v) => `+91${v.slice(-10)}`);

export const pincode = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

export const addressSchema = z.object({
  fullName: trimmed(2, 80, "Full name"),
  phone: indianMobile,
  line1: trimmed(3, 120, "Address"),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  landmark: z.string().trim().max(80).optional().or(z.literal("")),
  city: trimmed(2, 60, "City"),
  state: z.enum(INDIAN_STATES, { error: "Choose a state" }),
  pincode,
});
export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutSchema = z
  .object({
    addressId: z.string().min(1).optional(),
    address: addressSchema.optional(),
    saveAddress: z.boolean().default(true),
    email: z.email("Enter a valid email").optional().or(z.literal("")),
    paymentMethod: z.enum(["RAZORPAY", "COD"]),
    couponCode: z.string().trim().max(32).optional().or(z.literal("")),
    addFallPico: z.boolean().default(false),
    giftWrap: z.boolean().default(false),
    giftMessage: z.string().trim().max(300).optional().or(z.literal("")),
    customerNote: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine((v) => Boolean(v.addressId) !== Boolean(v.address), {
    message: "Choose a saved address or enter a new one",
    path: ["address"],
  });
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const contactSchema = z.object({
  name: trimmed(2, 80, "Name"),
  email: z.email("Enter a valid email"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: trimmed(3, 150, "Subject"),
  message: trimmed(10, 4000, "Message"),
  // Honeypot — must stay empty.
  website: z.string().max(0).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: trimmed(10, 3000, "Review"),
});

/** Flattens a ZodError into { field: message } for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}
