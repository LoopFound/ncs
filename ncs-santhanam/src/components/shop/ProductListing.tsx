"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { products } from "@/data/mock";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

interface ProductListingProps {
    initialCategory?: string;
}

export default function ProductListing({ initialCategory }: ProductListingProps) {
    const { addToCart } = useCart();
    const searchParams = useSearchParams();
    // If initialCategory is provided, use it. Otherwise fall back to URL param.
    // If specific page is used (e.g. /wedding), initialCategory will be "Wedding".
    // If /shop is used, initialCategory is undefined, so check "category" param.
    const categoryParam = searchParams.get("category");
    const activeCategory = initialCategory || categoryParam;

    const filteredProducts = activeCategory
        ? products.filter(
            (p) => p.category.toLowerCase() === activeCategory.toLowerCase() ||
                p.tags.some(t => t.toLowerCase() === activeCategory.toLowerCase())
        )
        : products;

    return (
        <div className="pt-24 lg:pt-32 pb-24">
            <div className="container mx-auto px-6 lg:px-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
                    <div>
                        <span className="text-xs tracking-[0.3em] uppercase text-[var(--charcoal-muted)] block mb-2">
                            {activeCategory ? "Collection" : "All Products"}
                        </span>
                        <h1 className="font-[var(--font-serif)] text-4xl lg:text-5xl font-light text-[var(--charcoal)]">
                            {activeCategory
                                ? `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}`
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
                                <li><Link href="/shop" className={`hover:text-[var(--gold)] ${!activeCategory ? 'text-[var(--gold)]' : ''}`}>All View</Link></li>
                                <li><Link href="/wedding" className={`hover:text-[var(--gold)] ${activeCategory === 'Wedding' ? 'text-[var(--gold)]' : ''}`}>Wedding Silks</Link></li>
                                <li>
                                    <Link href="/kanchipuram" className={`hover:text-[var(--gold)] ${activeCategory === 'Kanchipuram' ? 'text-[var(--gold)]' : ''}`}>Kanchipuram</Link>
                                    <ul className="pl-4 mt-2 space-y-2 text-xs border-l border-[var(--border)]">
                                        <li><Link href="/kanchipuram/traditional" className={`hover:text-[var(--gold)] ${activeCategory === 'Traditional' ? 'text-[var(--gold)]' : ''}`}>Traditional</Link></li>
                                        <li><Link href="/kanchipuram/borderless" className={`hover:text-[var(--gold)] ${activeCategory === 'Borderless' ? 'text-[var(--gold)]' : ''}`}>Borderless</Link></li>
                                        <li><Link href="/kanchipuram/fancy-kanjivarams" className={`hover:text-[var(--gold)] ${activeCategory === 'Fancy Kanjivarams' ? 'text-[var(--gold)]' : ''}`}>Fancy Kanjivarams</Link></li>
                                        <li><Link href="/kanchipuram/exclusives" className={`hover:text-[var(--gold)] ${activeCategory === 'Exclusives' ? 'text-[var(--gold)]' : ''}`}>Exclusives</Link></li>
                                    </ul>
                                </li>
                                <li><Link href="/soft-silk" className={`hover:text-[var(--gold)] ${activeCategory === 'Soft Silk' ? 'text(--gold)]' : ''}`}>Soft Silks</Link></li>
                                <li><Link href="/gift-sarees" className={`hover:text-[var(--gold)] ${activeCategory === 'Gift Sarees' ? 'text-[var(--gold)]' : ''}`}>Gift Sarees</Link></li>
                                <li><Link href="/pavadas" className={`hover:text-[var(--gold)] ${activeCategory === 'Pavadas' ? 'text-[var(--gold)]' : ''}`}>Pavadas</Link></li>
                                <li><Link href="/dupaatas" className={`hover:text-[var(--gold)] ${activeCategory === 'Dupattas' ? 'text-[var(--gold)]' : ''}`}>Dupattas</Link></li>
                                <li><Link href="/mens-corner" className={`hover:text-[var(--gold)] ${activeCategory === "Men's Corner" ? 'text-[var(--gold)]' : ''}`}>Men's Corner</Link></li>
                                <li><Link href="/materials" className={`hover:text-[var(--gold)] ${activeCategory === 'Materials' ? 'text-[var(--gold)]' : ''}`}>Materials</Link></li>
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
                                    <div key={product.id} className="group flex flex-col h-full">
                                        <Link href={`/shop/product/${product.id}`} className="block relative aspect-[3/4] bg-[var(--greige)] overflow-hidden mb-4">
                                            {/* Image placeholder logic or actual image */}
                                            <div className="absolute inset-0 bg-gray-200">
                                                {product.images[0] && (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                                )}
                                            </div>

                                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)]/5 to-[var(--bronze)]/10 pointer-events-none" />
                                            {/* Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 pointer-events-none" />
                                        </Link>
                                        <div className="text-center flex-1 flex flex-col">
                                            <p className="text-[10px] uppercase tracking-widest text-[var(--charcoal-muted)] mb-1">{product.category}</p>
                                            <Link href={`/shop/product/${product.id}`} className="block">
                                                <h3 className="font-[var(--font-serif)] text-lg text-[var(--charcoal)] hover:text-[var(--gold)] transition-colors">{product.name}</h3>
                                            </Link>
                                            <p className="text-sm mt-1 mb-4 flex-1">₹{product.price.toLocaleString('en-IN')}</p>

                                            <button
                                                onClick={() => addToCart({
                                                    id: product.id,
                                                    name: product.name,
                                                    price: product.price,
                                                    image: product.images[0] || '',
                                                    category: product.category
                                                })}
                                                className="w-full py-3 bg-[var(--navy)] text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                                            >
                                                Add to Bag
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[var(--greige)]/10 rounded-lg border border-[var(--border)]">
                                <p className="text-[var(--charcoal-muted)] mb-2">No products found in ths category.</p>
                                <p className="text-sm text-[var(--charcoal-light)]">Try checking back later or browse other collections.</p>
                                <Link href="/shop" className="inline-block mt-6 px-6 py-2 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest hover:bg-[var(--navy)] hover:text-white transition-colors">
                                    View all products
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
