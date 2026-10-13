import { db } from "../db";
import { cached, CacheTags } from "../cache";

export interface StoreInfo {
  storeName: string;
  legalName: string;
  gstin: string | null;
  phone: string | null;
  whatsapp: string | null;
  supportEmail: string | null;
  privacyEmail: string | null;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  hours: string;
  codEnabled: boolean;
  orderHoldMinutes: number;
}

export function getStoreInfo(): Promise<StoreInfo> {
  return cached("settings:store", { ttlSeconds: 600, tags: [CacheTags.settings] }, async () => {
    const s =
      (await db.storeSettings.findUnique({ where: { id: "default" } })) ??
      (await db.storeSettings.create({ data: { id: "default" } }));
    return {
      storeName: s.storeName,
      legalName: s.legalName,
      gstin: s.gstin,
      phone: s.phone,
      whatsapp: s.whatsapp,
      supportEmail: s.supportEmail,
      privacyEmail: s.privacyEmail,
      addressLine: s.addressLine,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      hours: s.hours,
      codEnabled: s.codEnabled,
      orderHoldMinutes: s.orderHoldMinutes,
    };
  });
}

/** wa.me link for the configured WhatsApp number, or null when none is set. */
export function whatsappLink(info: Pick<StoreInfo, "whatsapp">, text?: string): string | null {
  if (!info.whatsapp) return null;
  const digits = info.whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export interface BannerDTO {
  id: string;
  tag: string | null;
  title: string;
  subtitle: string | null;
  image: string;
  href: string | null;
  ctaLabel: string | null;
  accent: string | null;
}

export function getBanners(placement: "HERO" | "PROMO"): Promise<BannerDTO[]> {
  return cached(`banners:${placement}`, { ttlSeconds: 300, tags: [CacheTags.content] }, async () => {
    const now = new Date();
    const rows = await db.banner.findMany({
      where: {
        placement,
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((b) => ({
      id: b.id,
      tag: b.tag,
      title: b.title,
      subtitle: b.subtitle,
      image: b.image,
      href: b.href,
      ctaLabel: b.ctaLabel,
      accent: b.accent,
    }));
  });
}

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  productName: string;
  productSlug: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

/** Real, moderated customer reviews for the homepage (replaces the placeholder testimonials). */
export function getHomepageReviews(limit = 3): Promise<ReviewDTO[]> {
  return cached(`reviews:home:${limit}`, { ttlSeconds: 600, tags: [CacheTags.content] }, async () => {
    const rows = await db.review.findMany({
      where: { status: "APPROVED", rating: { gte: 4 } },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: [{ isVerifiedPurchase: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
    return rows.map(toReviewDTO);
  });
}

export function getProductReviews(productId: string, take = 20): Promise<ReviewDTO[]> {
  return cached(`reviews:product:${productId}:${take}`, { ttlSeconds: 300, tags: [CacheTags.content] }, async () => {
    const rows = await db.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { name: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(toReviewDTO);
  });
}

function toReviewDTO(r: {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  user: { name: string };
  product: { name: string; slug: string };
}): ReviewDTO {
  // Show first name + initial only.
  const [first, ...rest] = r.user.name.trim().split(/\s+/);
  const authorName = rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first;
  return {
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName,
    productName: r.product.name,
    productSlug: r.product.slug,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt.toISOString(),
  };
}
