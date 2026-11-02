"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type { products } from "@/data/mock";

interface QuickViewDialogProps {
    product: (typeof products)[number];
    onClose: () => void;
}

export default function QuickViewDialog({ product, onClose }: QuickViewDialogProps) {
    const { addToCart } = useCart();
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
            aria-labelledby="quick-view-title"
            className="m-auto w-[calc(100%-2rem)] max-w-3xl max-h-[85vh] overflow-y-auto bg-white p-0 backdrop:bg-black/60"
        >
            <div className="grid sm:grid-cols-2">
                <div className="relative aspect-[3/4] bg-[var(--greige)]">
                    {product.images[0] && (
                        <Image src={product.images[0]} alt={product.name} fill sizes="(min-width: 640px) 384px, 100vw" className="object-cover" />
                    )}
                </div>
                <div className="relative p-6 lg:p-8 flex flex-col">
                    <button
                        onClick={onClose}
                        aria-label="Close quick view"
                        className="absolute top-2 right-2 min-h-11 min-w-11 text-2xl leading-none text-[var(--navy)] hover:text-[var(--gold-text)] transition-colors"
                    >
                        &times;
                    </button>
                    <span className="text-[10px] uppercase tracking-widest text-[var(--gold-text)] font-semibold block mb-2 pr-10">
                        {product.category}
                    </span>
                    <h2 id="quick-view-title" className="font-serif text-3xl text-[var(--navy)] mb-3 pr-6">
                        {product.name}
                    </h2>
                    <p className="text-lg font-semibold text-[var(--charcoal)] mb-4">
                        ₹{product.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm leading-relaxed text-[var(--charcoal-light)] mb-4">{product.description}</p>
                    <ul className="space-y-1 text-xs text-[var(--charcoal-light)] mb-6">
                        {product.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                        ))}
                    </ul>
                    <div className="mt-auto space-y-3">
                        <button
                            onClick={() => {
                                addToCart({
                                    id: product.id,
                                    name: product.name,
                                    price: product.price,
                                    image: product.images[0] || '',
                                    category: product.category
                                });
                                onClose();
                            }}
                            className="w-full py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                        >
                            Add to Bag
                        </button>
                        <Link
                            href={`/shop/product/${product.id}`}
                            className="flex min-h-11 items-center justify-center text-xs uppercase tracking-widest text-[var(--navy)] underline underline-offset-4"
                        >
                            View Full Details
                        </Link>
                    </div>
                </div>
            </div>
        </dialog>
    );
}
