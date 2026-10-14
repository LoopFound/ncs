import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { PageHeader, Field, TextArea, Select, Check, Badge } from "@/components/admin/ui";
import ActionFormBound from "@/components/admin/ActionFormBound";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const actor = await requireStaff();
  const cats = await db.category.findMany({ orderBy: [{ path: "asc" }], include: { _count: { select: { products: true } } } });
  const roots = cats.filter((c) => !c.parentId);
  const parentOptions = [{ value: "", label: "— Top level —" }, ...roots.map((c) => ({ value: c.id, label: c.name }))];

  const form = (c?: (typeof cats)[number]) => (
    <div className="grid md:grid-cols-3 gap-3">
      <Field label="Name *" name="name" defaultValue={c?.name} required />
      <Field label="URL slug" name="slug" defaultValue={c?.slug} hint="Blank = from name" />
      <Select label="Parent" name="parentId" defaultValue={c?.parentId ?? ""} options={parentOptions.filter((o) => o.value !== c?.id)} />
      <TextArea label="Description" name="description" defaultValue={c?.description ?? ""} rows={2} className="md:col-span-3" />
      <Field label="Image URL" name="image" defaultValue={c?.image ?? ""} placeholder="/images/… or https://…" />
      <Field label="Sort order" name="sortOrder" type="number" defaultValue={c?.sortOrder ?? 0} />
      <Field label="HSN code" name="hsnCode" defaultValue={c?.hsnCode ?? "5007"} />
      <Field label="GST %" name="gstPercent" defaultValue={c ? String(c.gstRateBps / 100) : "5"} inputMode="decimal" hint="Confirm rates with your accountant" />
      <Field label="SEO title" name="seoTitle" defaultValue={c?.seoTitle ?? ""} />
      <Field label="SEO description" name="seoDescription" defaultValue={c?.seoDescription ?? ""} />
      <div className="flex gap-6 md:col-span-3">
        <Check label="Active" name="isActive" defaultChecked={c?.isActive ?? true} />
        <Check label="Show in navigation" name="showInNav" defaultChecked={c?.showInNav ?? true} />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Categories" description="URLs follow the tree, e.g. /kanchipuram/traditional." />
      <div className="space-y-3">
        {cats.map((c) => (
          <details key={c.id} className={`bg-white border border-[var(--border)] ${c.parentId ? "ml-8" : ""}`}>
            <summary className="cursor-pointer px-5 py-3 flex items-center justify-between gap-4">
              <span>
                <strong className="text-[var(--navy)]">{c.name}</strong> <span className="text-xs text-[var(--text-muted)]">/{c.path}</span>
              </span>
              <span className="flex gap-2 items-center text-xs">
                {!c.isActive && <Badge tone="warn">inactive</Badge>}
                <Badge>{c._count.products} products</Badge>
                <Badge tone="info">GST {c.gstRateBps / 100}%</Badge>
              </span>
            </summary>
            <div className="px-5 pb-5">
              <ActionFormBound kind="category" id={c.id}>
                {form(c)}
              </ActionFormBound>
              {actor.role === "admin" && c._count.products === 0 && (
                <div className="mt-3">
                  <DeleteButton kind="category" id={c.id} label="Delete category" />
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
      <details className="mt-8 bg-white border border-[var(--gold)]" open={cats.length === 0}>
        <summary className="cursor-pointer px-5 py-3 font-semibold text-[var(--navy)]">+ Add a category</summary>
        <div className="px-5 pb-5">
          <ActionFormBound kind="category" resetOnSuccess>
            {form()}
          </ActionFormBound>
        </div>
      </details>
    </>
  );
}
