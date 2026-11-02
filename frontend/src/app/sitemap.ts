import type { MetadataRoute } from "next";
import { products } from "@/data/mock";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/new",
  "/collections",
  "/wedding",
  "/kanchipuram",
  "/kanchipuram/traditional",
  "/kanchipuram/borderless",
  "/kanchipuram/fancy-kanjivarams",
  "/kanchipuram/exclusives",
  "/soft-silk",
  "/gift-sarees",
  "/pavadas",
  "/dupattas",
  "/mens-corner",
  "/materials",
  "/about",
  "/contact",
  "/faq",
  "/policies/shipping",
  "/policies/returns",
  "/policies/privacy",
  "/policies/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${SITE_URL}${route}` })),
    ...products.map((product) => ({ url: `${SITE_URL}/shop/product/${product.id}` })),
  ];
}
