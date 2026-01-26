"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { products } from "@/data/mock";
import { useParams, notFound } from "next/navigation";
import { useState } from "react";

export default function ProductDetailPage() {
    const params = useParams();
    const product = products.find((p) => p.id === params.id);
    const [activeImage, setActiveImage] = useState(0);

    if (!product) {
        return notFound();
    }

    return (
        <div className="pt-24 lg:pt-32 pb-24">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Breadcrumb */}
                <div className="text-xs uppercase tracking-wider text-[var(--charcoal-muted)] mb-8">
                    <Link href="/" className="hover:text-[var(--gold)]">Home</Link> /
                    <Link href="/shop" className="hover:text-[var(--gold)] mx-2">Shop</Link> /
                    <span className="text-[var(--charcoal)] ml-2">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-[var(--greige)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[var(--charcoal-muted)] text-xs tracking-widest uppercase opacity-50">
                                    Product Image {activeImage + 1}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[0, 1, 2, 3].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`aspect-square bg-[var(--greige)] relative overflow-hidden border ${activeImage === idx ? 'border-[var(--gold)]' : 'border-transparent'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="lg:sticky lg:top-32 h-fit">
                        <h1 className="font-[var(--font-serif)] text-4xl lg:text-5xl text-[var(--charcoal)] mb-4 leading-tight">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-2xl text-[var(--charcoal)]">₹{product.price.toLocaleString('en-IN')}</span>
                            {product.originalPrice && (
                                <span className="text-lg text-[var(--charcoal-muted)] line-through decoration-[var(--border)]">
                                    ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        <div className="w-full h-[1px] bg-[var(--border)] mb-8" />

                        <p className="text-[var(--charcoal-light)] leading-relaxed mb-8">
                            {product.description}
                        </p>

                        <div className="space-y-6 mb-10">
                            <h4 className="text-xs uppercase tracking-widest font-bold text-[var(--charcoal)]">Product Details</h4>
                            <ul className="space-y-3 text-sm text-[var(--charcoal-light)]">
                                {product.details.map((detail, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] mt-1.5 shrink-0" />
                                        {detail}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button className="flex-1 bg-[var(--charcoal)] text-white py-4 text-sm tracking-[0.15em] uppercase hover:bg-black transition-colors">
                                Add to Cart
                            </button>
                            <button className="flex-1 border border-[var(--charcoal)] text-[var(--charcoal)] py-4 text-sm tracking-[0.15em] uppercase hover:bg-[var(--charcoal)] hover:text-white transition-colors">
                                Buy Now
                            </button>
                        </div>

                        <div className="flex gap-6 text-xs uppercase tracking-wider text-[var(--charcoal-muted)] justify-center">
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5" /></svg>
                                Authentic Silk
                            </span>
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /></svg>
                                Handwoven
                            </span>
                            <span className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                                Free Shipping
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
