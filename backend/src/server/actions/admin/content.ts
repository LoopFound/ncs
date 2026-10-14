"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "../../db";
import { audit } from "../../audit";
import { getAuth } from "../../auth";
import { invalidateTags, CacheTags } from "../../cache";
import { normalizeCouponCode } from "../../services/coupons";
import { OrderError } from "../../services/orders";
import { adminRun, checkbox, formObject, id, optRupees, optText } from "./shared";

// ─── Coupons ───

const couponSchema = z
  .object({
    code: z.string().trim().min(3).max(32).transform(normalizeCouponCode).refine((c) => /^[A-Z0-9_-]+$/.test(c), "Letters, numbers, - and _ only"),
    description: optText(200),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Enter a value"),
    minOrderValue: optRupees,
    maxDiscount: optRupees,
    startsAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
    endsAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
    usageLimit: z.union([z.literal(""), z.coerce.number().int().positive()]).optional().transform((v) => (v === "" || v == null ? null : v)),
    perUserLimit: z.coerce.number().int().min(0).max(100).default(1),
    isActive: checkbox,
  })
  .refine((c) => c.type === "FIXED" || c.value <= 90, { message: "Percentage discounts are capped at 90%", path: ["value"] });

export async function saveCouponAction(fd: FormData, couponId?: string) {
  return adminRun("coupon.save", "admin", async (actor) => {
    const c = couponSchema.parse(formObject(fd));
    const data = {
      code: c.code,
      description: c.description,
      type: c.type,
      value: Math.round(c.value * 100), // PERCENT → basis points, FIXED → paise
      minOrderValue: c.minOrderValue ?? 0,
      maxDiscount: c.maxDiscount,
      startsAt: c.startsAt,
      endsAt: c.endsAt,
      usageLimit: c.usageLimit,
      perUserLimit: c.perUserLimit,
      isActive: c.isActive,
    };
    const clash = await db.coupon.findFirst({ where: { code: c.code, NOT: couponId ? { id: couponId } : undefined } });
    if (clash) throw new OrderError(`Coupon ${c.code} already exists.`);
    const saved = couponId ? await db.coupon.update({ where: { id: couponId }, data }) : await db.coupon.create({ data });
    await audit(actor.id, couponId ? "coupon.update" : "coupon.create", "coupon", saved.id, { code: c.code });
    revalidatePath("/admin/coupons");
    return { id: saved.id };
  });
}

// ─── Reviews ───

export async function moderateReviewAction(reviewId: string, status: "APPROVED" | "REJECTED") {
  return adminRun("review.moderate", "staff", async (actor) => {
    const r = await db.review.update({ where: { id: id.parse(reviewId) }, data: { status: z.enum(["APPROVED", "REJECTED"]).parse(status) }, include: { product: { select: { slug: true } } } });
    await invalidateTags([CacheTags.content, CacheTags.product(r.product.slug)]);
    await audit(actor.id, "review.moderate", "review", r.id, { status });
    revalidatePath("/admin/reviews");
    return undefined;
  });
}

// ─── Banners ───

const bannerSchema = z.object({
  placement: z.enum(["HERO", "PROMO"]),
  tag: optText(60),
  title: z.string().trim().min(2).max(120),
  subtitle: optText(240),
  image: z.string().trim().min(1, "Upload or enter an image").max(500),
  href: optText(300),
  ctaLabel: optText(40),
  accent: optText(60),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: checkbox,
  startsAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
  endsAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

export async function saveBannerAction(fd: FormData, bannerId?: string) {
  return adminRun("banner.save", "staff", async (actor) => {
    const b = bannerSchema.parse(formObject(fd));
    if (b.href && !b.href.startsWith("/") && !/^https:\/\//.test(b.href)) throw new OrderError("Links must start with / or https://");
    const saved = bannerId ? await db.banner.update({ where: { id: bannerId }, data: b }) : await db.banner.create({ data: b });
    await invalidateTags([CacheTags.content]);
    await audit(actor.id, bannerId ? "banner.update" : "banner.create", "banner", saved.id);
    revalidatePath("/admin/banners");
    return { id: saved.id };
  });
}

export async function deleteBannerAction(bannerId: string) {
  return adminRun("banner.delete", "staff", async (actor) => {
    await db.banner.delete({ where: { id: id.parse(bannerId) } });
    await invalidateTags([CacheTags.content]);
    await audit(actor.id, "banner.delete", "banner", bannerId);
    revalidatePath("/admin/banners");
    return undefined;
  });
}

// ─── Inbox ───

export async function setContactStatusAction(messageId: string, status: "NEW" | "READ" | "ARCHIVED") {
  return adminRun("contact.status", "staff", async () => {
    await db.contactMessage.update({ where: { id: id.parse(messageId) }, data: { status: z.enum(["NEW", "READ", "ARCHIVED"]).parse(status) } });
    revalidatePath("/admin/messages");
    return undefined;
  });
}

// ─── Store settings & shipping (admin only) ───

const settingsSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  legalName: z.string().trim().min(2).max(120),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])?$/, "Enter a valid 15-character GSTIN")
    .optional()
    .transform((v) => v || null),
  phone: optText(20),
  whatsapp: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s-]{9,15})?$/, "Enter a number with country code, e.g. +91 98xxx xxxxx")
    .optional()
    .transform((v) => v || null),
  supportEmail: z.email().optional().or(z.literal("")).transform((v) => v || null),
  privacyEmail: z.email().optional().or(z.literal("")).transform((v) => v || null),
  addressLine: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(60),
  state: z.string().trim().min(2).max(60),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/),
  hours: z.string().trim().min(3).max(200),
  codEnabled: checkbox,
  orderHoldMinutes: z.coerce.number().int().min(10).max(24 * 60),
});

export async function saveStoreSettingsAction(fd: FormData) {
  return adminRun("settings.save", "admin", async (actor) => {
    const s = settingsSchema.parse(formObject(fd));
    await db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default", ...s }, update: s });
    await invalidateTags([CacheTags.settings]);
    await audit(actor.id, "settings.update", "settings", "default", s);
    revalidatePath("/admin/settings");
    return undefined;
  });
}

const ruleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  pincodePrefixes: z
    .string()
    .optional()
    .transform((v) => (v ?? "").split(/[\s,]+/).map((s) => s.trim()).filter(Boolean))
    .refine((arr) => arr.every((p) => /^\d{1,6}$/.test(p)), "Prefixes are 1–6 digits, separated by commas"),
  rate: optRupees,
  freeAbove: optRupees,
  codAvailable: checkbox,
  codFee: optRupees,
  codMaxOrderValue: optRupees,
  etaMinDays: z.coerce.number().int().min(0).max(60),
  etaMaxDays: z.coerce.number().int().min(0).max(90),
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  isActive: checkbox,
});

export async function saveShippingRuleAction(fd: FormData, ruleId?: string) {
  return adminRun("shipping.save", "admin", async (actor) => {
    const r = ruleSchema.parse(formObject(fd));
    const data = {
      ...r,
      rate: r.rate ?? 0,
      codFee: r.codFee ?? 0,
      codMaxOrderValue: r.codMaxOrderValue ?? 5_000_000,
    };
    const saved = ruleId ? await db.shippingRule.update({ where: { id: ruleId }, data }) : await db.shippingRule.create({ data });
    await invalidateTags([CacheTags.settings]);
    await audit(actor.id, ruleId ? "shipping.update" : "shipping.create", "shipping_rule", saved.id, data);
    revalidatePath("/admin/settings");
    return { id: saved.id };
  });
}

export async function deleteShippingRuleAction(ruleId: string) {
  return adminRun("shipping.delete", "admin", async (actor) => {
    await db.shippingRule.delete({ where: { id: id.parse(ruleId) } });
    await invalidateTags([CacheTags.settings]);
    await audit(actor.id, "shipping.delete", "shipping_rule", ruleId);
    revalidatePath("/admin/settings");
    return undefined;
  });
}

// ─── Customers (admin only) ───

export async function setUserRoleAction(userId: string, role: "user" | "staff" | "admin") {
  return adminRun("user.role", "admin", async (actor) => {
    const uid = id.parse(userId);
    if (uid === actor.id) throw new OrderError("You can't change your own role.");
    const r = z.enum(["user", "staff", "admin"]).parse(role);
    await db.user.update({ where: { id: uid }, data: { role: r } });
    // Force fresh sessions so the new role applies immediately.
    await getAuth().api.revokeUserSessions({ body: { userId: uid }, headers: await headers() });
    await audit(actor.id, "user.role", "user", uid, { role: r });
    revalidatePath(`/admin/customers/${uid}`);
    return undefined;
  });
}

export async function setUserBannedAction(userId: string, banned: boolean, reason: string) {
  return adminRun("user.ban", "admin", async (actor) => {
    const uid = id.parse(userId);
    if (uid === actor.id) throw new OrderError("You can't ban yourself.");
    const h = await headers();
    if (banned) await getAuth().api.banUser({ body: { userId: uid, banReason: z.string().trim().max(200).parse(reason) || "Violation of terms" }, headers: h });
    else await getAuth().api.unbanUser({ body: { userId: uid }, headers: h });
    await audit(actor.id, banned ? "user.ban" : "user.unban", "user", uid, { reason });
    revalidatePath(`/admin/customers/${uid}`);
    return undefined;
  });
}
