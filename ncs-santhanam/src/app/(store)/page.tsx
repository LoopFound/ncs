import HeroSection from "@/components/home/HeroSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import CylinderCarousel3D from "@/components/home/CylinderCarousel3D";
import BrandStorySection from "@/components/home/BrandStorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import { getFeaturedProducts, getSignatureProducts } from "@/server/services/catalog";
import { getBanners, getHomepageReviews } from "@/server/services/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [banners, featured, signature, reviews] = await Promise.all([
    getBanners("HERO"),
    getFeaturedProducts(4),
    getSignatureProducts(),
    getHomepageReviews(3),
  ]);

  return (
    <>
      <HeroSection banners={banners} />
      <CollectionsSection />
      {signature.length > 0 && <CylinderCarousel3D sarees={signature} />}
      <BrandStorySection />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      {reviews.length > 0 && <TestimonialsSection reviews={reviews} />}
      <NewsletterSection />
    </>
  );
}
