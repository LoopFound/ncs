"use client";

import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

    const tax = cartTotal * 0.12; // 12% GST
    const total = cartTotal + tax;

    return (
        <div className="pt-32 pb-24 min-h-screen bg-[var(--cream)]">
            <div className="container mx-auto px-6 lg:px-12">
                <div className="mb-12">
                    <h1 className="font-[var(--font-serif)] text-4xl lg:text-5xl text-[var(--navy)]">Your Shopping Bag</h1>
                    <p className="text-[var(--text-muted)] mt-2 uppercase tracking-widest text-xs">
                        {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} in your bag
                    </p>
                </div>

                {cartItems.length > 0 ? (
                    <div className="grid lg:grid-cols-3 gap-12">
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-8">
                            {cartItems.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col sm:flex-row gap-6 p-6 bg-white border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="w-full sm:w-32 aspect-[3/4] bg-[var(--greige)] shrink-0 overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-widest text-[var(--gold-text)] mb-1">{item.category}</p>
                                                    <h3 className="font-[var(--font-serif)] text-xl text-[var(--navy)]">{item.name}</h3>
                                                </div>
                                                <p className="font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">Product ID: {item.id}</p>
                                        </div>

                                        <div className="flex justify-between items-center mt-6">
                                            <div className="flex items-center border border-[var(--border)] rounded-sm">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="px-3 py-1 hover:bg-[var(--cream)] transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className="px-4 py-1 text-sm border-x border-[var(--border)]">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="px-3 py-1 hover:bg-[var(--cream)] transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors underline underline-offset-4"
                                            >
                                                Remove Item
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white border border-[var(--border)] p-8 sticky top-32">
                                <h2 className="font-[var(--font-serif)] text-2xl text-[var(--navy)] mb-6">Order Summary</h2>

                                <div className="space-y-4 mb-8 text-sm">
                                    <div className="flex justify-between text-[var(--text-muted)]">
                                        <span>Subtotal</span>
                                        <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-[var(--text-muted)]">
                                        <span>Estimated GST (12%)</span>
                                        <span>₹{tax.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-[var(--text-muted)]">
                                        <span>Shipping</span>
                                        <span className="text-green-600 font-medium tracking-wide uppercase text-[10px]">Complimentary</span>
                                    </div>
                                    <div className="h-[1px] bg-[var(--border)] my-6" />
                                    <div className="flex justify-between text-lg font-medium text-[var(--navy)]">
                                        <span>Total</span>
                                        <span>₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="block text-center w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                                >
                                    Proceed to Checkout
                                </Link>

                                <div className="mt-8 space-y-4">
                                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        SECURE CHECKOUT & ENCRYPTED DATA
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        </svg>
                                        INSURED WORLDWIDE DELIVERY
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto text-center py-20">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--gold)]">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 0 1-8 0" />
                            </svg>
                        </div>
                        <h2 className="font-[var(--font-serif)] text-3xl text-[var(--navy)] mb-4">Your bag is empty</h2>
                        <p className="text-[var(--text-muted)] mb-10 leading-relaxed">
                            Discover our exquisite collection of handcrafted silk sarees and find your perfect masterpiece.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-block px-10 py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
