import type { NextConfig } from "next";

// Media host for product images uploaded through the admin (S3 / CloudFront).
// Read at build time; pass S3_PUBLIC_URL as a Docker build arg.
function mediaPatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
    { protocol: "https", hostname: "**.cloudfront.net" },
    { protocol: "https", hostname: "**.amazonaws.com" },
  ];
  const base = process.env.S3_PUBLIC_URL;
  if (base) {
    const u = new URL(base);
    patterns.push({
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      port: u.port || undefined,
      pathname: `${u.pathname.replace(/\/$/, "")}/**`,
    });
  }
  return patterns;
}

// Product URLs from the original demo (/shop/product/p1 …) → slug URLs.
const legacyProductIds: Record<string, string> = {
  p1: "royal-kanchipuram-silk",
  p2: "classic-gold-border-pattu",
  p3: "soft-silk-pastel-dreams",
  p4: "temple-zari-weave",
  p5: "vintage-green-handloom",
  p6: "bridal-red-samudrika",
  p7: "mustard-korvai-silk",
  p8: "ethereal-borderless-kanjivaram",
  p9: "pastel-dual-tone-kanjivaram",
  p10: "thousand-butta-kanjivaram",
  p11: "festive-shrimathi-gift-silk",
  p12: "kalyani-shagun-silk",
  p13: "kanchipuram-pattu-pavada-girls",
  p14: "kanchipuram-silk-dupatta",
  p15: "mayilkan-pure-silk-dhoti-set",
  p16: "pure-kanchipuram-brocade-fabric",
};

// Pin the project root so standalone output is flat (.next/standalone/server.js)
// regardless of lockfiles in parent directories.
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  poweredByHeader: false,
  serverExternalPackages: ["pino", "pg", "ioredis", "bullmq", "pdf-lib"],
  // Bound build parallelism so builds fit in small CI runners / containers.
  experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS ?? 4) },
  images: {
    remotePatterns: mediaPatterns(),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return Object.entries(legacyProductIds).map(([id, slug]) => ({
      source: `/shop/product/${id}`,
      destination: `/shop/${slug}`,
      permanent: true,
    }));
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
