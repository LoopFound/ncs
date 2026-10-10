"use client";

import ActionForm from "./ActionForm";
import { Field, TextArea, Select, Check } from "./ui";
import { saveProductAction } from "@/server/actions/admin/catalog";

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  subtitle: string;
  description: string;
  story: string;
  collection: string;
  fabric: string;
  weave: string;
  zari: string;
  occasion: string;
  care: string;
  colorName: string;
  colorHex: string;
  craftTime: string;
  details: string[];
  motifs: string[];
  tags: string[];
  isFeatured: boolean;
  isSignature: boolean;
  isNewArrival: boolean;
  sortRank: number;
  hsnCode: string;
  gstPercent: string;
  seoTitle: string;
  seoDescription: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  unit: "PIECE" | "METRE";
  maxPerOrder: number;
  lowStockThreshold: number;
  weightGrams: number;
}

export default function ProductForm({ values, categories }: { values: ProductFormValues; categories: { value: string; label: string }[] }) {
  const isNew = !values.id;
  return (
    <ActionForm
      action={(fd) => saveProductAction(fd, values.id)}
      submitLabel={isNew ? "Create product" : "Save changes"}
      redirectTo={(data) => (isNew ? `/admin/products/${(data as { id: string }).id}` : null)}
      className="space-y-8"
    >
      <fieldset className="grid md:grid-cols-2 gap-4">
        <legend className="font-serif !text-xl text-[var(--navy)] mb-3">Basics</legend>
        <Field label="Name *" name="name" defaultValue={values.name} required maxLength={160} />
        <Field label="URL slug" name="slug" defaultValue={values.slug} hint="Leave blank to generate from the name" maxLength={80} />
        <Select label="Category *" name="categoryId" defaultValue={values.categoryId} options={categories} required />
        <Select
          label="Status"
          name="status"
          defaultValue={values.status}
          options={[
            { value: "DRAFT", label: "Draft (hidden)" },
            { value: "ACTIVE", label: "Active (on sale)" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
        />
        <Field label="Subtitle" name="subtitle" defaultValue={values.subtitle} maxLength={200} className="md:col-span-2" />
        <TextArea label="Description *" name="description" defaultValue={values.description} rows={5} required className="md:col-span-2" />
        <TextArea label="Story line (italic quote)" name="story" defaultValue={values.story} rows={2} className="md:col-span-2" />
      </fieldset>

      <fieldset className="grid md:grid-cols-3 gap-4">
        <legend className="font-serif !text-xl text-[var(--navy)] mb-3">Price & stock</legend>
        <Field label="SKU *" name="sku" defaultValue={values.sku} required maxLength={48} />
        <Field label="Price (₹, incl. GST) *" name="price" defaultValue={values.price} required inputMode="decimal" />
        <Field label="Compare-at price (₹)" name="compareAtPrice" defaultValue={values.compareAtPrice} inputMode="decimal" hint="Shown struck through" />
        <Select
          label="Sold per"
          name="unit"
          defaultValue={values.unit}
          options={[
            { value: "PIECE", label: "Piece" },
            { value: "METRE", label: "Metre" },
          ]}
        />
        <Field label="Max per order" name="maxPerOrder" type="number" min={1} max={100} defaultValue={values.maxPerOrder} />
        <Field label="Low-stock alert at" name="lowStockThreshold" type="number" min={0} defaultValue={values.lowStockThreshold} />
        <Field label="Shipping weight (g)" name="weightGrams" type="number" min={1} defaultValue={values.weightGrams} />
        {isNew && <Field label="Opening stock" name="initialStock" type="number" min={0} defaultValue={0} />}
        <Field label="HSN code override" name="hsnCode" defaultValue={values.hsnCode} hint="Blank = category's HSN" maxLength={10} />
        <Field label="GST % override" name="gstPercent" defaultValue={values.gstPercent} hint="Blank = category's rate" inputMode="decimal" />
      </fieldset>

      <fieldset className="grid md:grid-cols-3 gap-4">
        <legend className="font-serif !text-xl text-[var(--navy)] mb-3">Weave details</legend>
        <Field label="Collection" name="collection" defaultValue={values.collection} />
        <Field label="Fabric" name="fabric" defaultValue={values.fabric} />
        <Field label="Weave" name="weave" defaultValue={values.weave} />
        <Field label="Zari" name="zari" defaultValue={values.zari} />
        <Field label="Occasion" name="occasion" defaultValue={values.occasion} />
        <Field label="Care" name="care" defaultValue={values.care} />
        <Field label="Colour name" name="colorName" defaultValue={values.colorName} />
        <Field label="Colour hex" name="colorHex" defaultValue={values.colorHex} placeholder="#8B1E2D" />
        <Field label="Time on loom" name="craftTime" defaultValue={values.craftTime} placeholder="42 Days on Loom" />
        <TextArea label="Detail lines (one per line)" name="details" defaultValue={values.details.join("\n")} rows={5} />
        <TextArea label="Motifs (one per line)" name="motifs" defaultValue={values.motifs.join("\n")} rows={5} />
        <TextArea label="Tags (one per line)" name="tags" defaultValue={values.tags.join("\n")} rows={5} hint="Used by search" />
      </fieldset>

      <fieldset className="grid md:grid-cols-4 gap-4 items-end">
        <legend className="font-serif !text-xl text-[var(--navy)] mb-3">Merchandising</legend>
        <Check label="Featured on homepage" name="isFeatured" defaultChecked={values.isFeatured} />
        <Check label="In signature carousel" name="isSignature" defaultChecked={values.isSignature} />
        <Check label="New arrival" name="isNewArrival" defaultChecked={values.isNewArrival} />
        <Field label="Sort rank (lower first)" name="sortRank" type="number" min={0} defaultValue={values.sortRank} />
      </fieldset>

      <fieldset className="grid md:grid-cols-2 gap-4">
        <legend className="font-serif !text-xl text-[var(--navy)] mb-3">Search engines</legend>
        <Field label="SEO title" name="seoTitle" defaultValue={values.seoTitle} maxLength={70} />
        <Field label="SEO description" name="seoDescription" defaultValue={values.seoDescription} maxLength={170} />
      </fieldset>
    </ActionForm>
  );
}
