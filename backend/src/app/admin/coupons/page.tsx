import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { redirect } from "next/navigation";
import { formatINR } from "@/lib/money";
import { PageHeader, Field, Select, Check, Badge } from "@/components/admin/ui";
import ActionFormBound from "@/components/admin/ActionFormBound";

export const metadata = { title: "Coupons" };

const toLocal = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16) : "");

export default async function CouponsPage() {
  const actor = await requireStaff();
  if (actor.role !== "admin") redirect("/admin");
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  const form = (c?: (typeof coupons)[number]) => (
    <div className="grid md:grid-cols-4 gap-3">
      <Field label="Code *" name="code" defaultValue={c?.code} required />
      <Select
        label="Type"
        name="type"
        defaultValue={c?.type ?? "PERCENT"}
        options={[
          { value: "PERCENT", label: "Percent off" },
          { value: "FIXED", label: "Fixed ₹ off" },
        ]}
      />
      <Field label="Value (% or ₹) *" name="value" defaultValue={c ? String(c.value / 100) : ""} required inputMode="decimal" />
      <Field label="Max discount (₹)" name="maxDiscount" defaultValue={c?.maxDiscount != null ? String(c.maxDiscount / 100) : ""} inputMode="decimal" />
      <Field label="Min order (₹)" name="minOrderValue" defaultValue={c ? String(c.minOrderValue / 100) : ""} inputMode="decimal" />
      <Field label="Total uses" name="usageLimit" defaultValue={c?.usageLimit ?? ""} type="number" min={1} hint="Blank = unlimited" />
      <Field label="Uses per customer" name="perUserLimit" defaultValue={c?.perUserLimit ?? 1} type="number" min={0} hint="0 = unlimited" />
      <Field label="Description" name="description" defaultValue={c?.description ?? ""} />
      <Field label="Starts" name="startsAt" type="datetime-local" defaultValue={toLocal(c?.startsAt ?? null)} />
      <Field label="Ends" name="endsAt" type="datetime-local" defaultValue={toLocal(c?.endsAt ?? null)} />
      <div className="flex items-end pb-2">
        <Check label="Active" name="isActive" defaultChecked={c?.isActive ?? true} />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Coupons" description="Discounts apply to the GST-inclusive subtotal; GST is recalculated on the discounted amount." />
      <div className="space-y-3">
        {coupons.map((c) => (
          <details key={c.id} className="bg-white border border-[var(--border)]">
            <summary className="cursor-pointer px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono font-semibold">{c.code}</span>
              <span className="flex gap-2 text-xs">
                <Badge tone={c.isActive ? "good" : "neutral"}>{c.isActive ? "active" : "off"}</Badge>
                <Badge>{c.type === "PERCENT" ? `${c.value / 100}% off` : `${formatINR(c.value)} off`}</Badge>
                <Badge tone="info">
                  used {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </Badge>
              </span>
            </summary>
            <div className="px-5 pb-5">
              <ActionFormBound kind="coupon" id={c.id}>
                {form(c)}
              </ActionFormBound>
            </div>
          </details>
        ))}
      </div>
      <details className="mt-8 bg-white border border-[var(--gold)]" open={coupons.length === 0}>
        <summary className="cursor-pointer px-5 py-3 font-semibold text-[var(--navy)]">+ New coupon</summary>
        <div className="px-5 pb-5">
          <ActionFormBound kind="coupon" resetOnSuccess>
            {form()}
          </ActionFormBound>
        </div>
      </details>
    </>
  );
}
