import HeroSection from "@/components/home/HeroSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import BrandStorySection from "@/components/home/BrandStorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import { getFeaturedProducts } from "@/server/services/catalog";
import { getBanners, getHomepageReviews } from "@/server/services/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [banners, featured, reviews] = await Promise.all([
    getBanners("HERO"),
    getFeaturedProducts(4),
    getHomepageReviews(3),
  ]);

  return (
    <>
      <HeroSection banners={banners} />
      <CollectionsSection />
      <BrandStorySection />
      {featured.length > 0 && <FeaturedProducts products={featured} />}
      {reviews.length > 0 && <TestimonialsSection reviews={reviews} />}
      <NewsletterSection />
    </>
  );
}
