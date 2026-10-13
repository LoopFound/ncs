"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface Props {
  fabrics: string[];
}

const PRICE_BANDS = [
  { value: "", label: "Any price" },
  { value: "0-15000", label: "Under ₹15,000" },
  { value: "15000-30000", label: "₹15,000 – ₹30,000" },
  { value: "30000-50000", label: "₹30,000 – ₹50,000" },
  { value: "50000-", label: "Above ₹50,000" },
];

/** Filter/sort controls. A plain GET form, enhanced to update the URL without a full reload. */
export default function ListingControls({ fabrics }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  const select = "bg-white border border-[var(--border)] px-3 py-2 text-sm text-[var(--navy)] focus:outline-none focus:border-[var(--gold)]";

  return (
    <form method="get" className={`flex flex-wrap items-end gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      {params.get("q") && <input type="hidden" name="q" value={params.get("q") ?? ""} />}
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        Sort
        <select name="sort" className={select} defaultValue={params.get("sort") ?? ""} onChange={(e) => update("sort", e.target.value)}>
          <option value="">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </label>
      {fabrics.length > 1 && (
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          Fabric
          <select name="fabric" className={select} defaultValue={params.get("fabric") ?? ""} onChange={(e) => update("fabric", e.target.value)}>
            <option value="">All fabrics</option>
            {fabrics.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
        Price
        <select name="price" className={select} defaultValue={params.get("price") ?? ""} onChange={(e) => update("price", e.target.value)}>
          {PRICE_BANDS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-[var(--navy)] pb-2">
        <input
          type="checkbox"
          name="instock"
          value="1"
          defaultChecked={params.get("instock") === "1"}
          onChange={(e) => update("instock", e.target.checked ? "1" : "")}
          className="w-4 h-4 accent-[var(--navy)]"
        />
        In stock only
      </label>
      <noscript>
        <button type="submit" className="px-4 py-2 bg-[var(--navy)] text-white text-xs uppercase tracking-widest">
          Apply
        </button>
      </noscript>
    </form>
  );
}
