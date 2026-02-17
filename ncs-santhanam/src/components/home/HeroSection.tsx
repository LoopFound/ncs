"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center bg-[#2E1A47] overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(30deg, #4B2C7A 12%, transparent 12.5%, transparent 87%, #4B2C7A 87.5%, #4B2C7A),
                        linear-gradient(150deg, #4B2C7A 12%, transparent 12.5%, transparent 87%, #4B2C7A 87.5%, #4B2C7A),
                        linear-gradient(30deg, #4B2C7A 12%, transparent 12.5%, transparent 87%, #4B2C7A 87.5%, #4B2C7A),
                        linear-gradient(150deg, #4B2C7A 12%, transparent 12.5%, transparent 87%, #4B2C7A 87.5%, #4B2C7A),
                        linear-gradient(60deg, #4B2C7A77 25%, transparent 25.5%, transparent 75%, #4B2C7A77 75%, #4B2C7A77),
                        linear-gradient(60deg, #4B2C7A77 25%, transparent 25.5%, transparent 75%, #4B2C7A77 75%, #4B2C7A77)
                    `,
                    backgroundSize: '80px 140px',
                    backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
                }}
            />

            <div className="container mx-auto px-6 lg:px-12 relative z-20 pt-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
                    {/* Content Left */}
                    <div className="flex flex-col items-start relative z-10 w-full">
                        {/* Connecting Line & Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative mb-8 group w-full"
                        >
                            <div className="flex items-center relative w-fit gap-3">
                                <span className="text-white text-sm md:text-base tracking-[0.1em] font-medium whitespace-nowrap z-20 relative">
                                    Handcrafted in Kanchipuram
                                </span>

                                {/* Start Dot */}
                                <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] relative z-20" />

                                {/* SVG Line connecting to image */}
                                <div className="hidden lg:block absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none z-10">
                                    <svg width="100%" height="100%" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
                                        {/* Horizontal line then angled down to point at the saree */}
                                        <path d="M0 0 H350 L580 280" stroke="white" strokeOpacity="0.7" strokeWidth="1.5" />
                                        {/* End Dot on the saree */}
                                        <circle cx="580" cy="280" r="4" fill="white" className="drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                                    </svg>
                                </div>
                            </div>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="font-[var(--font-serif)] text-6xl md:text-8xl lg:text-9xl font-light !text-white leading-none mb-12 tracking-wide"
                        >
                            Timeless
                            <br />
                            <span className="italic font-light opacity-90">Elegance</span>
                        </motion.h1>

                        {/* Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-wrap gap-5"
                        >
                            <Link
                                href="/collections"
                                className="inline-flex items-center justify-center px-10 py-5 bg-[var(--gold)] text-[var(--navy)] text-xs font-bold tracking-[0.2em] uppercase hover:bg-white transition-all duration-300 shadow-xl"
                            >
                                Explore Collection
                            </Link>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center px-10 py-5 bg-[#0B1B4D] text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#1a2c66] transition-all duration-300 shadow-xl border border-[#0B1B4D]"
                            >
                                Shop Now
                            </Link>
                        </motion.div>
                    </div>

                    {/* Image Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="relative h-full flex justify-center lg:justify-end items-center"
                    >
                        {/* We use mix-blend-mode or relative positioning to make it stand out */}
                        <div className="relative w-full max-w-lg lg:max-w-xl h-auto z-10">
                            <Image
                                src="/images/hero/hero-model.png"
                                alt="Kanchipuram Saree"
                                width={800}
                                height={1200}
                                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Down Arrow */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[var(--gold)]"
            >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="bg-transparent">
                    <path d="M7 13l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </motion.div>
        </section>
    );
}
