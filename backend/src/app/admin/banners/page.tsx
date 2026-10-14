import { db } from "@/server/db";
import { PageHeader, Field, Select, Check, Badge } from "@/components/admin/ui";
import ActionFormBound from "@/components/admin/ActionFormBound";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Homepage banners" };

const toLocal = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");

export default async function BannersPage() {
  const banners = await db.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }] });

  const form = (b?: (typeof banners)[number]) => (
    <div className="grid md:grid-cols-3 gap-3">
      <Select
        label="Placement"
        name="placement"
        defaultValue={b?.placement ?? "HERO"}
        options={[
          { value: "HERO", label: "Homepage hero (switchable looks)" },
          { value: "PROMO", label: "Promotional strip" },
        ]}
      />
      <Field label="Tag line" name="tag" defaultValue={b?.tag ?? ""} placeholder="Royal Muhurtham Edit" />
      <Field label="Title *" name="title" defaultValue={b?.title} required />
      <Field label="Subtitle" name="subtitle" defaultValue={b?.subtitle ?? ""} className="md:col-span-2" />
      <Field label="Image URL *" name="image" defaultValue={b?.image} required hint="Upload via a product's image manager, or use /images/…" />
      <Field label="Link" name="href" defaultValue={b?.href ?? ""} placeholder="/wedding" />
      <Field label="Button label" name="ctaLabel" defaultValue={b?.ctaLabel ?? ""} />
      <Field label="Sort order" name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} />
      <Field label="Show from" name="startsAt" type="datetime-local" defaultValue={toLocal(b?.startsAt ?? null)} />
      <Field label="Show until" name="endsAt" type="datetime-local" defaultValue={toLocal(b?.endsAt ?? null)} />
      <div className="flex items-end pb-2">
        <Check label="Active" name="isActive" defaultChecked={b?.isActive ?? true} />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Homepage banners" description="Hero looks rotate on the homepage; schedule seasonal edits with start and end dates." />
      <div className="space-y-3">
        {banners.map((b) => (
          <details key={b.id} className="bg-white border border-[var(--border)]">
            <summary className="cursor-pointer px-5 py-3 flex items-center justify-between gap-4">
              <span className="flex items-center gap-3">
                <img src={b.image} alt="" className="w-12 h-12 object-cover" />
                <strong>{b.title}</strong>
              </span>
              <span className="flex gap-2 text-xs">
                <Badge>{b.placement.toLowerCase()}</Badge>
                <Badge tone={b.isActive ? "good" : "neutral"}>{b.isActive ? "live" : "hidden"}</Badge>
              </span>
            </summary>
            <div className="px-5 pb-5">
              <ActionFormBound kind="banner" id={b.id}>
                {form(b)}
              </ActionFormBound>
              <div className="mt-3">
                <DeleteButton kind="banner" id={b.id} />
              </div>
            </div>
          </details>
        ))}
      </div>
      <details className="mt-8 bg-white border border-[var(--gold)]" open={banners.length === 0}>
        <summary className="cursor-pointer px-5 py-3 font-semibold text-[var(--navy)]">+ New banner</summary>
        <div className="px-5 pb-5">
          <ActionFormBound kind="banner" resetOnSuccess>
            {form()}
          </ActionFormBound>
        </div>
      </details>
    </>
  );
}
