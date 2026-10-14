"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-[var(--cream)] pt-32 pb-24 flex items-center justify-center overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--gold)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--maroon)]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto bg-white shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[var(--border)]">

                    {/* Visual Section */}
                    <div className="md:w-1/2 relative min-h-[300px] md:min-h-full bg-[var(--navy)] overflow-hidden">
                        <img
                            src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
                            alt="Luxury Saree"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 blend-overlay"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)] via-transparent to-transparent" />

                        <div className="absolute inset-0 p-12 flex flex-col justify-end text-white">
                            <h2 className="font-[var(--font-serif)] text-4xl mb-4 leading-tight">Masterpieces <br />Crafted with Passion.</h2>
                            <p className="text-white/70 text-sm leading-relaxed tracking-wide">
                                Join our exclusive heritage boutique and discover the world&apos;s finest handcrafted Kanchipuram silk.
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="md:w-1/2 p-8 lg:p-16 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            {isLogin ? (
                                <motion.div
                                    key="login"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="mb-10 text-center md:text-left">
                                        <h1 className="font-[var(--font-serif)] text-3xl text-[var(--navy)] mb-2">Welcome Back</h1>
                                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest">Sign in to your account</p>
                                    </div>

                                    <form className="space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                placeholder="grace@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">Password</label>
                                                <a href="#" className="text-[10px] text-[var(--gold-text)] uppercase tracking-widest hover:underline">Forgot?</a>
                                            </div>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <button className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300">
                                            Sign In
                                        </button>
                                    </form>

                                    <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
                                        <p className="text-[var(--text-muted)] text-sm">
                                            Don&apos;t have an account? <br className="md:hidden" />
                                            <button
                                                onClick={() => setIsLogin(false)}
                                                className="text-[var(--gold-text)] font-bold uppercase tracking-widest text-[10px] ml-2 hover:underline"
                                            >
                                                Create Account
                                            </button>
                                        </p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="signup"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="mb-10 text-center md:text-left">
                                        <h1 className="font-[var(--font-serif)] text-3xl text-[var(--navy)] mb-2">Join the Heritage</h1>
                                        <p className="text-[var(--text-muted)] text-sm uppercase tracking-widest">Create your boutique account</p>
                                    </div>

                                    <form className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">First Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                    placeholder="Grace"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                    placeholder="Hopper"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                placeholder="grace@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--navy)]/60">Password</label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-3 bg-[var(--cream)]/30 border border-[var(--border)] focus:border-[var(--gold)] outline-none transition-colors text-sm"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <button className="w-full py-4 bg-[var(--navy)] text-white text-xs uppercase tracking-[0.2em] font-medium hover:bg-[var(--gold)] hover:text-[var(--navy)] transition-all duration-300 mt-4">
                                            Create Account
                                        </button>
                                    </form>

                                    <div className="mt-8 pt-8 border-t border-[var(--border)] text-center">
                                        <p className="text-[var(--text-muted)] text-sm">
                                            Already have an account? <br className="md:hidden" />
                                            <button
                                                onClick={() => setIsLogin(true)}
                                                className="text-[var(--gold-text)] font-bold uppercase tracking-widest text-[10px] ml-2 hover:underline"
                                            >
                                                Sign In Instead
                                            </button>
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
