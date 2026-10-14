// Server-safe admin UI primitives (no hooks).
import Link from "next/link";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        <h1 className="font-serif !text-3xl text-[var(--navy)] !mb-1">{title}</h1>
        {description && <p className="text-sm text-[var(--text-muted)] !mb-0">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-[var(--border)] p-6 ${className}`}>
      {title && <h2 className="font-serif !text-xl text-[var(--navy)] mb-4">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white border border-[var(--border)] p-5">
      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] !mb-1">{label}</p>
      <p className="font-serif !text-3xl text-[var(--navy)] !mb-0">{value}</p>
      {hint && <p className="text-xs text-[var(--text-muted)] !mb-0 mt-1">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "info" }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    good: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warn: "bg-amber-50 text-amber-900 border-amber-200",
    bad: "bg-red-50 text-red-800 border-red-200",
    info: "bg-sky-50 text-sky-900 border-sky-200",
  };
  return <span className={`inline-block text-[11px] px-2 py-0.5 border rounded-full whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) {
  return (
    <div className="bg-white border border-[var(--border)] overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--cream)] text-left">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
      </table>
      {empty && <p className="p-6 text-sm text-[var(--text-muted)] text-center !mb-0">{empty}</p>}
    </div>
  );
}

export const td = "px-4 py-3 align-top";

export function Pagination({ page, pageCount, href }: { page: number; pageCount: number; href: (p: number) => string }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2 mt-6 text-sm">
      {page > 1 && (
        <Link href={href(page - 1)} className="px-3 py-1.5 border border-[var(--border)] bg-white">
          ← Prev
        </Link>
      )}
      <span className="px-3 text-[var(--text-muted)]">
        Page {page} of {pageCount}
      </span>
      {page < pageCount && (
        <Link href={href(page + 1)} className="px-3 py-1.5 border border-[var(--border)] bg-white">
          Next →
        </Link>
      )}
    </nav>
  );
}

const inputCls = "mt-1 w-full px-3 py-2 border border-[var(--border)] bg-white text-sm text-[var(--navy)] focus:outline-none focus:border-[var(--gold)]";
const labelCls = "block text-[10px] uppercase tracking-widest text-[var(--text-muted)]";

export function Field({ label, name, hint, className = "", ...props }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`${labelCls} ${className}`}>
      {label}
      <input name={name} {...props} className={inputCls} />
      {hint && <span className="block normal-case tracking-normal text-[11px] mt-1">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, name, hint, className = "", ...props }: { label: string; name: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={`${labelCls} ${className}`}>
      {label}
      <textarea name={name} {...props} className={inputCls} />
      {hint && <span className="block normal-case tracking-normal text-[11px] mt-1">{hint}</span>}
    </label>
  );
}

export function Select({ label, name, options, className = "", ...props }: { label: string; name: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={`${labelCls} ${className}`}>
      {label}
      <select name={name} {...props} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--navy)]">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4 accent-[var(--navy)]" />
      {label}
    </label>
  );
}

export const btn = {
  primary: "px-4 py-2 bg-[var(--navy)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--navy)] disabled:opacity-50",
  secondary: "px-4 py-2 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest hover:bg-[var(--navy)] hover:text-white disabled:opacity-50",
  danger: "px-4 py-2 border border-[var(--maroon)] text-[var(--maroon)] text-xs uppercase tracking-widest hover:bg-[var(--maroon)] hover:text-white disabled:opacity-50",
};
