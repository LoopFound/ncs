"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { products } from "@/data/mock";
import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
    const params = useParams();
    const { addToCart } = useCart();
    const product = products.find((p) => p.id === params.id);
    const [activeImage, setActiveImage] = useState(0);

    if (!product) {
        return notFound();
    }

    return (
        <div className="pt-24 lg:pt-32 pb-24 bg-[var(--cream)]">
            <div className="container mx-auto px-6 lg:px-12">
                {/* Breadcrumb */}
                <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--navy)]/60 mb-12">
                    <Link href="/" className="hover:text-[var(--gold)] transition-colors">Home</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <Link href="/shop" className="hover:text-[var(--gold)] transition-colors">Shop</Link>
                    <span className="mx-3 opacity-30">/</span>
                    <span className="text-[var(--navy)]">{product.name}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Image Gallery */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="aspect-[3/4] bg-white relative overflow-hidden shadow-sm"
                        >
                            {product.images[activeImage] ? (
                                <img
                                    src={product.images[activeImage]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-[var(--greige)]">
                                    <span className="text-[var(--navy)]/30 text-xs tracking-widest uppercase italic">
                                        Ethereal Silk Masterpiece
                                    </span>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-4 gap-4">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(idx)}
                                    className={`aspect-[3/4] bg-white relative overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-[var(--gold)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} alt={`${product.name} view ${idx}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="lg:sticky lg:top-32 h-fit">
                        <div className="mb-8">
                            <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] font-bold mb-3 block">
                                {product.category}
                            </span>
                            <h1 className="font-[var(--font-serif)] text-4xl lg:text-5xl text-[var(--navy)] mb-6 leading-[1.1]">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-6">
                                <span className="text-3xl text-[var(--navy)] font-light">₹{product.price.toLocaleString('en-IN')}</span>
                                {product.originalPrice && (
                                    <span className="text-xl text-[var(--navy)]/30 line-through font-light">
                                        ₹{product.originalPrice.toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="w-full h-[1px] bg-[var(--border)] mb-10" />

                        <div className="prose prose-sm mb-12">
                            <p className="text-[var(--text-body)] leading-relaxed italic opacity-80">
                                {product.description}
                            </p>
                        </div>

                        <div className="space-y-8 mb-12">
                            <div>
                                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--navy)] mb-4">The Craftsmanship</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm text-[var(--text-body)]/80">
                                    {product.details.map((detail, i) => (
                                        <li key={i} className="flex gap-3 items-center">
                                            <span className="w-1.5 h-[1px] bg-[var(--gold)] shrink-0" />
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-4 mb-12">
                            <button
                                onClick={() => addToCart({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.images[0] || '',
                                    category: product.category
                                })}
                                className="w-full bg-[var(--navy)] text-white py-5 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 shadow-xl shadow-blue-900/10"
                            >
                                Add to Bag
                            </button>
                            <button className="w-full border border-[var(--navy)] text-[var(--navy)] py-5 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--navy)] hover:text-white transition-all duration-300">
                                Reserve Collection
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-8">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--gold)]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5" /></svg>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-[var(--navy)]/60 font-medium">100% Authentic Silk</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--gold)]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-[var(--navy)]/60 font-medium">Secured Payment</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--gold)]">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /></svg>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-[var(--navy)]/60 font-medium">Global Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
