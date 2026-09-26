"use client";

import HeroSection from "@/components/home/HeroSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import CylinderCarousel3D from "@/components/home/CylinderCarousel3D";
import BrandStorySection from "@/components/home/BrandStorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import NewsletterSection from "@/components/home/NewsletterSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <CollectionsSection />
      <CylinderCarousel3D />
      <BrandStorySection />
      <FeaturedProducts />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
