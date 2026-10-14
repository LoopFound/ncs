"use client";

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
    const categoryParam = searchParams.get("category");
    const activeCategory = initialCategory || categoryParam;

    const filteredProducts = activeCategory
        ? products.filter((p) => {
            const cat = activeCategory.toLowerCase().trim();
            const pCat = p.category.toLowerCase().trim();
            return (
                pCat === cat ||
                pCat.includes(cat) ||
                cat.includes(pCat) ||
                p.tags.some(t => t.toLowerCase().includes(cat) || cat.includes(t.toLowerCase()))
            );
        })
        : products;

    return (
        <div className="pt-24 lg:pt-32 pb-24 min-h-[75vh]">
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
                                : "The Heritage Collection"
                            }
                        </h1>
                    </div>

                    <div className="text-sm text-[var(--charcoal-muted)] mt-4 md:mt-0 font-medium">
                        Showing {filteredProducts.length} {filteredProducts.length === 1 ? "weave" : "weaves"}
                    </div>
                </div>

                {/* Layout: Sidebar + Grid */}
                <div className="grid lg:grid-cols-4 gap-12">
                    {/* Sidebar Filters */}
                    <div className="hidden lg:block space-y-8">
                        <div>
                            <h4 className="font-serif text-lg mb-4 text-[var(--navy)]">Categories</h4>
                            <ul className="space-y-3 text-sm text-[var(--charcoal-light)]">
                                <li><Link href="/shop" className={`hover:text-[var(--gold-text)] ${!activeCategory ? 'text-[var(--gold-text)] font-semibold' : ''}`}>All View</Link></li>
                                <li><Link href="/wedding" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Wedding' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Wedding Silks</Link></li>
                                <li>
                                    <Link href="/kanchipuram" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Kanchipuram' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Kanchipuram</Link>
                                    <ul className="pl-4 mt-2 space-y-2 text-xs border-l border-[var(--border)]">
                                        <li><Link href="/kanchipuram/traditional" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Traditional' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Traditional</Link></li>
                                        <li><Link href="/kanchipuram/borderless" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Borderless' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Borderless</Link></li>
                                        <li><Link href="/kanchipuram/fancy-kanjivarams" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Fancy Kanjivarams' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Fancy Kanjivarams</Link></li>
                                        <li><Link href="/kanchipuram/exclusives" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Exclusives' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Exclusives</Link></li>
                                    </ul>
                                </li>
                                <li><Link href="/soft-silk" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Soft Silk' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Soft Silks</Link></li>
                                <li><Link href="/gift-sarees" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Gift Sarees' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Gift Sarees</Link></li>
                                <li><Link href="/pavadas" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Pavadas' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Pavadas</Link></li>
                                <li><Link href="/dupattas" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Dupattas' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Dupattas</Link></li>
                                <li><Link href="/mens-corner" className={`hover:text-[var(--gold-text)] ${activeCategory === "Men's Corner" ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Men&apos;s Corner</Link></li>
                                <li><Link href="/materials" className={`hover:text-[var(--gold-text)] ${activeCategory === 'Materials' ? 'text-[var(--gold-text)] font-semibold' : ''}`}>Materials</Link></li>
                            </ul>
                        </div>

                        <div className="w-10 h-[1px] bg-[var(--border)]" />

                        <div>
                            <h4 className="font-serif text-lg mb-4 text-[var(--navy)]">Craftsmanship</h4>
                            <ul className="space-y-2 text-xs text-[var(--charcoal-light)]">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                                    <span>Silk Mark Authorized</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                                    <span>Pure Silver & Gold Zari</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                                    <span>Interlocking Korvai Technique</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="lg:col-span-3">
                        {filteredProducts.length > 0 ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="group flex flex-col h-full bg-white p-4 border border-[var(--border)] rounded-sm hover:shadow-lg transition-all duration-300">
                                        <Link href={`/shop/product/${product.id}`} className="block relative aspect-[3/4] bg-[var(--greige)] overflow-hidden mb-4">
                                            <div className="absolute inset-0 bg-gray-100">
                                                {product.images[0] && (
                                                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                                                )}
                                            </div>
                                        </Link>

                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <span className="text-[10px] uppercase tracking-widest text-[var(--gold-text)] font-semibold block mb-1">
                                                    {product.category}
                                                </span>
                                                <h3 className="font-[var(--font-serif)] text-lg text-[var(--navy)] group-hover:text-[var(--gold-text)] transition-colors line-clamp-1">
                                                    <Link href={`/shop/product/${product.id}`}>
                                                        {product.name}
                                                    </Link>
                                                </h3>
                                                <p className="text-sm font-semibold text-[var(--charcoal)] mt-2">
                                                    ₹{product.price.toLocaleString('en-IN')}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => addToCart({
                                                    id: product.id,
                                                    name: product.name,
                                                    price: product.price,
                                                    image: product.images[0] || '',
                                                    category: product.category
                                                })}
                                                className="w-full mt-4 py-3 bg-[var(--navy)] text-white text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                                            >
                                                Add to Bag
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[var(--cream)]/60 rounded-xl border border-[var(--border)] p-8">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 text-[var(--gold)] shadow-xs">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>
                                </div>
                                <h3 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-2">No Weaves Found</h3>
                                <p className="text-sm text-[var(--charcoal-light)] max-w-md mx-auto mb-6">
                                    We currently do not have sarees matching &quot;{activeCategory}&quot;. Please explore our wider collection or speak to our Kanchipuram concierge.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    <Link href="/shop" className="px-6 py-3 bg-[var(--navy)] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-colors">
                                        View All Silks
                                    </Link>
                                    <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-[var(--navy)] text-[var(--navy)] text-xs uppercase tracking-widest font-semibold hover:bg-[var(--navy)] hover:text-white transition-colors">
                                        Ask Concierge
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
