import type { Metadata } from "next";
import type { ReactNode } from "react";
import { products } from "@/data/mock";

type Props = {
  params: Promise<{ id: string }>;
  children: ReactNode;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) return {};

  return {
    // The parent layout's plain title resets the root template.
    title: { absolute: `${product.name} | NCS Santhanam` },
    description: product.description,
    alternates: { canonical: `/shop/product/${product.id}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductLayout({ params, children }: Props) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description,
              image: product.images,
              category: product.category,
              offers: { "@type": "Offer", price: product.price, priceCurrency: "INR" },
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      {children}
    </>
  );
}
