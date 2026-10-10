import { categoryOptions } from "@/server/services/admin-queries";
import { PageHeader } from "@/components/admin/ui";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await categoryOptions();
  return (
    <>
      <PageHeader title="New product" description="Create the product, then add images and stock." />
      <div className="bg-white border border-[var(--border)] p-6">
        <ProductForm
          categories={categories}
          values={{
            name: "", slug: "", categoryId: categories[0]?.value ?? "", status: "DRAFT", subtitle: "", description: "", story: "", collection: "",
            fabric: "", weave: "", zari: "", occasion: "", care: "Dry Clean Only", colorName: "", colorHex: "", craftTime: "", details: [], motifs: [], tags: [],
            isFeatured: false, isSignature: false, isNewArrival: true, sortRank: 100, hsnCode: "", gstPercent: "", seoTitle: "", seoDescription: "",
            sku: "", price: "", compareAtPrice: "", unit: "PIECE", maxPerOrder: 5, lowStockThreshold: 2, weightGrams: 900,
          }}
        />
      </div>
    </>
  );
}
