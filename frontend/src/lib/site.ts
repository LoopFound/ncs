// Set NEXT_PUBLIC_SITE_URL in production. The fallback is taken from the contact email's domain.
// On Vercel, fall back to the project's production domain so canonical URLs and the sitemap never
// point at a domain that is not serving this site.
const VERCEL_PRODUCTION = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? VERCEL_PRODUCTION ?? "https://ncsanthanam.in";
