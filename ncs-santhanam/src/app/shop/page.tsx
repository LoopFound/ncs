"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { products } from "@/data/mock";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ShopContent() {
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get("category");

    const filteredProducts = categoryFilter
        ? products.filter(
            (p) => p.category.toLowerCase() === categoryFilter.toLowerCase() ||
                p.tags.some(t => t.toLowerCase() === categoryFilter.toLowerCase())
        )
        : products;

    return (
        <div className="pt-24 lg:pt-32 pb-24">
            <div className="container mx-auto px-6 lg:px-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                    <div>
                        <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-2">
                            All Products
                        </span>
                        <h1 className="font-[var(--font-serif)] text-4xl lg:text-5xl font-light text-[var(--charcoal)]">
                            {categoryFilter
                                ? `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Collection`
                                : "The Collection"
                            }
                        </h1>
                    </div>

                    <div className="text-sm text-[var(--charcoal-muted)] mt-4 md:mt-0">
                        Showing {filteredProducts.length} results
                    </div>
                </div>

                {/* Layout: Sidebar + Grid */}
                <div className="grid lg:grid-cols-4 gap-12">
                    {/* Sidebar Filters */}
                    <div className="hidden lg:block space-y-8">
                        <div>
                            <h4 className="font-serif text-lg mb-4">Categories</h4>
                            <ul className="space-y-3 text-sm text-[var(--charcoal-light)]">
                                <li><Link href="/shop" className={`hover:text-[var(--gold)] ${!categoryFilter ? 'text-[var(--gold)]' : ''}`}>All View</Link></li>
                                <li><Link href="/shop?category=wedding" className="hover:text-[var(--gold)]">Wedding Silks</Link></li>
                                <li><Link href="/shop?category=kanchipuram" className="hover:text-[var(--gold)]">Kanchipuram</Link></li>
                                <li><Link href="/shop?category=soft-silk" className="hover:text-[var(--gold)]">Soft Silks</Link></li>
                            </ul>
                        </div>

                        <div className="w-10 h-[1px] bg-[var(--border)]" />

                        <div>
                            <h4 className="font-serif text-lg mb-4">Price Range</h4>
                            <ul className="space-y-3 text-sm text-[var(--charcoal-light)]">
                                <li><a href="#" className="hover:text-[var(--gold)]">Under ₹20,000</a></li>
                                <li><a href="#" className="hover:text-[var(--gold)]">₹20,000 - ₹50,000</a></li>
                                <li><a href="#" className="hover:text-[var(--gold)]">Above ₹50,000</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        {filteredProducts.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <Link key={product.id} href={`/shop/product/${product.id}`} className="group">
                                        <div className="aspect-[3/4] bg-[var(--greige)] relative overflow-hidden mb-4">
                                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10 group-hover:scale-105 transition-transform duration-700 ease-out" />
                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] uppercase tracking-widest text-[var(--charcoal-muted)] mb-1">{product.category}</p>
                                            <h3 className="font-[var(--font-serif)] text-lg text-[var(--charcoal)] group-hover:text-[var(--gold)] transition-colors">{product.name}</h3>
                                            <p className="text-sm mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[var(--greige)]">
                                <p className="text-[var(--charcoal-muted)]">No products found in this category.</p>
                                <Link href="/shop" className="inline-block mt-4 text-sm underline hover:text-[var(--gold)]">View all products</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--ivory)]" />}>
            <ShopContent />
        </Suspense>
    );
}
