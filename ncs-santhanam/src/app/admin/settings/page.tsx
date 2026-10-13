import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { requireStaff } from "@/server/session";
import { formatINR } from "@/lib/money";
import { INDIAN_STATES } from "@/lib/india";
import { PageHeader, Card, Field, Select, Check, Badge } from "@/components/admin/ui";
import ActionFormBound from "@/components/admin/ActionFormBound";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata = { title: "Store & shipping" };

const r = (paise: number | null) => (paise == null ? "" : String(paise / 100));

export default async function SettingsPage() {
  const actor = await requireStaff();
  if (actor.role !== "admin") redirect("/admin");
  const [s, rules] = await Promise.all([
    db.storeSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} }),
    db.shippingRule.findMany({ orderBy: [{ priority: "desc" }, { name: "asc" }] }),
  ]);

  const ruleForm = (x?: (typeof rules)[number]) => (
    <div className="grid md:grid-cols-4 gap-3">
      <Field label="Name *" name="name" defaultValue={x?.name} required />
      <Field label="PIN prefixes" name="pincodePrefixes" defaultValue={x?.pincodePrefixes.join(", ") ?? ""} hint="e.g. 60, 61 — blank = all India" className="md:col-span-2" />
      <Field label="Priority" name="priority" type="number" defaultValue={x?.priority ?? 0} />
      <Field label="Shipping charge (₹)" name="rate" defaultValue={r(x?.rate ?? 0)} inputMode="decimal" />
      <Field label="Free above (₹)" name="freeAbove" defaultValue={r(x?.freeAbove ?? null)} inputMode="decimal" hint="Blank = never free" />
      <Field label="Delivery days (min)" name="etaMinDays" type="number" defaultValue={x?.etaMinDays ?? 3} />
      <Field label="Delivery days (max)" name="etaMaxDays" type="number" defaultValue={x?.etaMaxDays ?? 6} />
      <Field label="COD fee (₹)" name="codFee" defaultValue={r(x?.codFee ?? 0)} inputMode="decimal" />
      <Field label="COD limit (₹)" name="codMaxOrderValue" defaultValue={r(x?.codMaxOrderValue ?? 5_000_000)} inputMode="decimal" />
      <div className="flex gap-6 items-end pb-2 md:col-span-2">
        <Check label="COD available" name="codAvailable" defaultChecked={x?.codAvailable ?? true} />
        <Check label="Active" name="isActive" defaultChecked={x?.isActive ?? true} />
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title="Store & shipping" description="Contact details shown across the site, invoice details and delivery rules." />
      <div className="space-y-8">
        <Card title="Store details">
          {!s.gstin && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3">Add your GSTIN — it is printed on every tax invoice.</p>}
          {!s.phone && !s.whatsapp && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-3">No phone or WhatsApp number is set, so none is shown to customers.</p>}
          <ActionFormBound kind="settings" id="default">
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Store name" name="storeName" defaultValue={s.storeName} required />
              <Field label="Legal name (invoices)" name="legalName" defaultValue={s.legalName} required />
              <Field label="GSTIN" name="gstin" defaultValue={s.gstin ?? ""} maxLength={15} />
              <Field label="Phone" name="phone" defaultValue={s.phone ?? ""} placeholder="+91 44 1234 5678" />
              <Field label="WhatsApp number" name="whatsapp" defaultValue={s.whatsapp ?? ""} placeholder="+91 98xxx xxxxx" />
              <Field label="Support email" name="supportEmail" type="email" defaultValue={s.supportEmail ?? ""} />
              <Field label="Privacy email" name="privacyEmail" type="email" defaultValue={s.privacyEmail ?? ""} />
              <Field label="Address line" name="addressLine" defaultValue={s.addressLine} required className="md:col-span-2" />
              <Field label="City" name="city" defaultValue={s.city} required />
              <Select label="State" name="state" defaultValue={s.state} options={INDIAN_STATES.map((x) => ({ value: x, label: x }))} />
              <Field label="PIN code" name="pincode" defaultValue={s.pincode} required />
              <Field label="Showroom hours" name="hours" defaultValue={s.hours} required className="md:col-span-2" />
              <Field label="Online payment hold (minutes)" name="orderHoldMinutes" type="number" min={10} defaultValue={s.orderHoldMinutes} hint="Unpaid orders release stock after this" />
              <div className="flex items-end pb-2">
                <Check label="Cash on delivery enabled" name="codEnabled" defaultChecked={s.codEnabled} />
              </div>
            </div>
          </ActionFormBound>
        </Card>

        <div>
          <h2 className="font-serif !text-2xl text-[var(--navy)] mb-2">Shipping rules</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">The most specific PIN prefix wins; a rule with no prefixes covers the rest of India. PIN codes matching no rule can&apos;t check out.</p>
          <div className="space-y-3">
            {rules.map((x) => (
              <details key={x.id} className="bg-white border border-[var(--border)]">
                <summary className="cursor-pointer px-5 py-3 flex flex-wrap justify-between gap-3">
                  <strong>{x.name}</strong>
                  <span className="flex gap-2 text-xs">
                    <Badge>{x.pincodePrefixes.length ? x.pincodePrefixes.join(", ") : "all India"}</Badge>
                    <Badge tone="info">{x.rate ? formatINR(x.rate) : "free"}</Badge>
                    <Badge tone={x.codAvailable ? "good" : "neutral"}>{x.codAvailable ? "COD" : "no COD"}</Badge>
                    {!x.isActive && <Badge tone="warn">inactive</Badge>}
                  </span>
                </summary>
                <div className="px-5 pb-5">
                  <ActionFormBound kind="shippingRule" id={x.id}>
                    {ruleForm(x)}
                  </ActionFormBound>
                  <div className="mt-3">
                    <DeleteButton kind="shippingRule" id={x.id} />
                  </div>
                </div>
              </details>
            ))}
          </div>
          <details className="mt-4 bg-white border border-[var(--gold)]">
            <summary className="cursor-pointer px-5 py-3 font-semibold text-[var(--navy)]">+ New shipping rule</summary>
            <div className="px-5 pb-5">
              <ActionFormBound kind="shippingRule" resetOnSuccess>
                {ruleForm()}
              </ActionFormBound>
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
