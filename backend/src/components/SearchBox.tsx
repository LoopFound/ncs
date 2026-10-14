"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/money";

interface Suggestion {
  slug: string;
  name: string;
  categoryName: string;
  image: string | null;
  price: number;
}

export default function SearchBox({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [fetched, setItems] = useState<Suggestion[]>([]);
  const items = q.trim().length >= 2 ? fetched : [];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as { suggestions: Suggestion[] };
          setItems(data.suggestions);
          setActive(-1);
          setOpen(true);
        }
      } catch {
        /* aborted or offline — ignore */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  const dark = variant === "dark";

  return (
    <form
      ref={boxRef}
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && items[active]) go(`/shop/${items[active].slug}`);
        else if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search sarees
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(items.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(-1, i - 1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search weaves…"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={`w-full md:w-52 2xl:w-64 rounded-full px-5 py-2.5 text-sm outline-none transition-colors ${
          dark
            ? "bg-white/10 border border-white/25 text-white placeholder:text-white/50 focus:border-[var(--gold)]"
            : "bg-[#F5F1E8] border border-transparent text-[var(--navy)] placeholder:text-[var(--navy)]/50 shadow-lg focus:border-[var(--gold)]"
        }`}
      />
      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden z-50"
        >
          {items.map((s, i) => (
            <li
              key={s.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(`/shop/${s.slug}`);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${i === active ? "bg-[var(--cream)]" : ""}`}
            >
              <div className="w-10 h-12 bg-[var(--greige)] shrink-0 overflow-hidden rounded-sm">
                {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--navy)] truncate !mb-0">{s.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] !mb-0">
                  {s.categoryName} · {formatINR(s.price)}
                </p>
              </div>
            </li>
          ))}
          <li
            role="option"
            aria-selected={false}
            onMouseDown={(e) => {
              e.preventDefault();
              go(`/shop?q=${encodeURIComponent(q.trim())}`);
            }}
            className="px-4 py-2.5 text-xs uppercase tracking-widest text-[var(--gold-text)] border-t border-[var(--border)] cursor-pointer hover:bg-[var(--cream)]"
          >
            See all results for “{q.trim()}”
          </li>
        </ul>
      )}
    </form>
  );
}
