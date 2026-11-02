"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { products } from "@/data/mock";
import { suggestProducts } from "@/lib/product-search";

export default function SiteSearch({ onNavigate }: { onNavigate: () => void }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const suggestions = suggestProducts(products, query);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
        onNavigate();
    };

    return (
        <div className="absolute left-0 right-0 top-full bg-[var(--navy)] border-t border-white/10 shadow-lg">
            <div className="container mx-auto px-6 lg:px-8 py-4">
                <form role="search" onSubmit={handleSubmit}>
                    <input
                        type="search"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search sarees, silks and weaves"
                        aria-label="Search products"
                        className="w-full bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none focus:ring-2 focus:ring-[var(--gold)]"
                    />
                </form>
                {query.trim() && (
                    <ul className="mt-2 divide-y divide-white/10">
                        {suggestions.map((product) => (
                            <li key={product.id}>
                                <Link
                                    href={`/shop/product/${product.id}`}
                                    onClick={onNavigate}
                                    className="flex min-h-11 items-center justify-between gap-4 py-2 text-sm text-white hover:text-[#E5C158]"
                                >
                                    <span>{product.name}</span>
                                    <span className="shrink-0 text-xs text-white/70">₹{product.price.toLocaleString('en-IN')}</span>
                                </Link>
                            </li>
                        ))}
                        {suggestions.length === 0 && (
                            <li className="py-3 text-sm text-white/70">No matching weaves</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
