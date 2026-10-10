"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, animate, type PanInfo, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/money";
import type { SignatureProduct } from "@/server/services/catalog";

const FALLBACK_IMAGE = "/images/collections/wedding.png";

interface CardProps {
  card: SignatureProduct;
  cardWidth: number;
  cardHeight: number;
  onExplore: (card: SignatureProduct) => void;
  hasDragged: boolean;
}

function SignatureCard({ card, cardWidth, cardHeight, onExplore, hasDragged }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -24, scale: 0.96 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: `${-cardWidth / 2}px`,
        marginTop: `${-cardHeight / 2}px`,
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        zIndex: 10,
        pointerEvents: "auto",
      }}
      className="select-none will-change-transform cursor-pointer group"
      onClick={() => {
        if (!hasDragged) onExplore(card);
      }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#C9A227] shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_28px_rgba(201,162,39,0.28)] ring-1 ring-[#C9A227]/60 bg-[#0A163B] flex flex-col">
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={card.image ?? FALLBACK_IMAGE}
            alt={card.name}
            draggable={false}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060E26]/90 via-[#0B1B4D]/55 via-45% to-transparent pointer-events-none" />

          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
            {card.tag && (
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#F5F1E8] bg-[#0B1B4D]/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#C9A227]/40">
                {card.tag}
              </span>
            )}
            {card.craftTime && (
              <span className="text-[10px] tracking-wider text-[#C9A227] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#C9A227]/30 font-mono">
                {card.craftTime}
              </span>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 p-3.5 flex flex-col z-10">
            {card.subtitle && <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A227] font-semibold mb-1">{card.subtitle}</span>}
            <h3 className="font-serif !text-lg !text-white font-normal tracking-wide leading-tight group-hover:!text-[#F3E5AB] transition-colors">{card.name}</h3>
            <p className="text-[10px] !text-white/70 line-clamp-1 mt-1 font-light tracking-wide !mb-0">{[card.weave, card.zari].filter(Boolean).join(" • ")}</p>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-medium text-[#F5F1E8]">{formatINR(card.price)}</span>
                {card.compareAtPrice && card.compareAtPrice > card.price && (
                  <span className="text-xs text-white/40 line-through">{formatINR(card.compareAtPrice)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExplore(card);
                }}
                className="text-[11px] tracking-wider uppercase px-3.5 py-1.5 rounded-full bg-[#C9A227] text-[#0B1B4D] hover:bg-[#d8b43d] font-semibold"
              >
                Explore Drape
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DrapeDialog({ saree, onClose }: { saree: SignatureProduct; onClose: () => void }) {
  const { addToCart, isPending } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="relative w-full max-w-4xl bg-gradient-to-br from-[#0B1B4D] via-[#091538] to-[#040A1C] border border-[#C9A227]/40 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-10 my-8 text-white"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C9A227] text-white hover:text-[#0B1B4D] border border-white/20 transition-all flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[3/4] md:aspect-auto md:h-full min-h-[380px] bg-black/40 overflow-hidden">
            <img src={saree.image ?? FALLBACK_IMAGE} alt={saree.name} className="w-full h-full object-cover object-center" />
            {saree.tag && (
              <span className="absolute top-4 left-4 text-xs uppercase tracking-widest text-[#0B1B4D] font-bold bg-[#C9A227] px-3 py-1 rounded-full">{saree.tag}</span>
            )}
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {saree.collection && <span className="text-xs uppercase tracking-[0.25em] text-[#C9A227] font-semibold block mb-1">{saree.collection}</span>}
              <h3 id={titleId} className="font-serif !text-3xl sm:!text-4xl !text-white font-normal mb-2">
                {saree.name}
              </h3>
              {saree.subtitle && <p className="text-xs !text-[#C9A227] tracking-wider uppercase mb-4">{saree.subtitle}</p>}
              <p className="text-sm !text-white/80 leading-relaxed font-light mb-6">{saree.description}</p>

              <dl className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs mb-6">
                {(
                  [
                    ["Fabric", saree.fabric],
                    ["Zari", saree.zari],
                    ["Weave", saree.weave],
                    ["Loom time", saree.craftTime],
                  ] as const
                )
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-white/40 text-[10px] uppercase tracking-wider">{k}</dt>
                      <dd className="text-white/90 font-medium">{v}</dd>
                    </div>
                  ))}
              </dl>

              {saree.motifs.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 mb-6" aria-label="Motifs woven">
                  {saree.motifs.map((m) => (
                    <li key={m} className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/25">
                      ✦ {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{formatINR(saree.price)}</span>
                  {saree.compareAtPrice && saree.compareAtPrice > saree.price && (
                    <span className="text-sm text-white/40 line-through">{formatINR(saree.compareAtPrice)}</span>
                  )}
                </div>
                <Link href={`/shop/${saree.slug}`} className="text-[11px] text-[#C9A227] underline underline-offset-4">
                  View full details
                </Link>
              </div>
              <button
                type="button"
                disabled={!saree.inStock || isPending}
                onClick={async () => {
                  if (await addToCart(saree.variantId, 1, saree.name)) onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#C9A227] hover:bg-[#d8b43d] text-[#0B1B4D] font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {saree.inStock ? "Add to Bag" : "Sold Out"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CylinderCarousel3D({ sarees }: { sarees: SignatureProduct[] }) {
  const [showAll, setShowAll] = useState(false);
  const activeSarees = useMemo(() => (showAll ? sarees : sarees.slice(0, 6)), [sarees, showAll]);
  const totalCards = activeSarees.length;
  const angleStep = 360 / Math.max(1, totalCards);

  const [cardSize, setCardSize] = useState({ width: 230, height: 350 });
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setCardSize({ width: 220, height: 340 });
      else if (window.innerWidth < 1024) setCardSize({ width: 225, height: 345 });
      else setCardSize({ width: 230, height: 350 });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { stiffness: 100, damping: 22, mass: 0.8 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = smoothRotation.on("change", (latest) => {
      setActiveIndex(Math.round(((-latest / angleStep) % totalCards) + totalCards) % totalCards);
    });
    return () => unsubscribe();
  }, [smoothRotation, angleStep, totalCards]);

  const [hasDragged, setHasDragged] = useState(false);
  const startRotationRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePanStart = () => {
    setHasDragged(false);
    setIsDragging(true);
    startRotationRef.current = rotation.get();
    setIsAutoplay(false);
  };

  const handlePan = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 6 || Math.abs(info.offset.y) > 6) setHasDragged(true);
    rotation.set(startRotationRef.current + info.offset.x * 0.22);
  };

  const handlePanEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const projected = rotation.get() + info.velocity.x * 0.08;
    animate(rotation, Math.round(projected / angleStep) * angleStep, { type: "spring", stiffness: 95, damping: 20, mass: 0.85 });
    window.setTimeout(() => setHasDragged(false), 80);
  };

  const step = useCallback(
    (dir: 1 | -1) => {
      setIsAutoplay(false);
      const currentSnap = Math.round(rotation.get() / angleStep) * angleStep;
      animate(rotation, currentSnap - dir * angleStep, { type: "spring", stiffness: 110, damping: 22 });
    },
    [angleStep, rotation],
  );

  const rotateToCard = useCallback(
    (index: number) => {
      const relAngle = ((((index * angleStep + rotation.get()) % 360) + 540) % 360) - 180;
      animate(rotation, rotation.get() - relAngle, { type: "spring", stiffness: 110, damping: 22 });
    },
    [angleStep, rotation],
  );

  useEffect(() => {
    if (!isAutoplay || isHovered || isDragging) return;
    const timer = window.setInterval(() => {
      const currentSnap = Math.round(rotation.get() / angleStep) * angleStep;
      animate(rotation, currentSnap - angleStep, { type: "spring", stiffness: 90, damping: 22 });
    }, 4500);
    return () => window.clearInterval(timer);
  }, [isAutoplay, isHovered, isDragging, angleStep, rotation]);

  const [selected, setSelected] = useState<SignatureProduct | null>(null);
  const closeDialog = useCallback(() => setSelected(null), []);
  const current = activeSarees[activeIndex] ?? activeSarees[0];
  if (!current) return null;

  return (
    <section
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      className="relative py-20 lg:py-28 bg-gradient-to-b from-[#050C24] via-[#091538] to-[#04091A] text-white overflow-hidden border-y border-[#C9A227]/25"
      aria-roledescription="carousel"
      aria-label="Signature drapes"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(201,162,39,0.15)_0%,_rgba(11,27,77,0.3)_45%,_transparent_75%)] blur-2xl" />
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "radial-gradient(#C9A227 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-10 lg:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase mb-4">
            The Signature Drapes
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light !text-white tracking-tight leading-none mb-4">
            Woven to Be <span className="italic font-normal text-[#C9A227]">Remembered</span>
          </h2>
          <p className="text-sm sm:text-base !text-[#E5E5E5]/75 font-light leading-relaxed max-w-xl mx-auto">
            An archival curation of heirloom weaves, each draped in generations of tradition and master artisan devotion.
          </p>
          {sarees.length > 6 && (
            <div className="mt-6 inline-flex p-1 rounded-full bg-white/5 border border-white/10" role="group" aria-label="Curated view">
              {[false, true].map((all) => (
                <button
                  key={String(all)}
                  type="button"
                  aria-pressed={showAll === all}
                  onClick={() => {
                    setShowAll(all);
                    rotation.set(0);
                  }}
                  className={`px-3 py-1 text-xs rounded-full transition-all ${showAll === all ? "bg-[#C9A227] text-[#0B1B4D] font-semibold" : "text-white/70 hover:text-white"}`}
                >
                  {all ? `All ${sarees.length}` : "6 Signatures"}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <div
          className="relative w-full max-w-6xl mx-auto flex items-center justify-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C9A227]"
          tabIndex={0}
          aria-label="Use the left and right arrow keys to browse"
          onKeyDown={(e) => {
            // Scoped to the carousel: arrow keys elsewhere on the page are left alone.
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              step(-1);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              step(1);
            } else if (e.key === "Enter") {
              setSelected(current);
            }
          }}
        >
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous drape"
            className="absolute left-2 sm:left-6 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#0B1B4D]/85 hover:bg-[#0B1B4D] border border-[#C9A227]/40 hover:border-[#C9A227] text-[#C9A227] flex items-center justify-center transition-all hover:scale-110"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next drape"
            className="absolute right-2 sm:right-6 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#0B1B4D]/85 hover:bg-[#0B1B4D] border border-[#C9A227]/40 hover:border-[#C9A227] text-[#C9A227] flex items-center justify-center transition-all hover:scale-110"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <motion.div
            className={`relative w-full h-[390px] sm:h-[410px] md:h-[430px] flex items-center justify-center touch-pan-y ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
          >
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none" aria-live="polite">
              <AnimatePresence mode="wait">
                <SignatureCard key={current.id} card={current} cardWidth={cardSize.width} cardHeight={cardSize.height} onExplore={setSelected} hasDragged={hasDragged} />
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-6">
          <div className="text-center min-h-[44px] flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-light text-white/90">
            <span className="text-[#C9A227] font-mono text-xs uppercase tracking-widest bg-[#C9A227]/10 px-2.5 py-0.5 rounded border border-[#C9A227]/25">
              {String(activeIndex + 1).padStart(2, "0")} / {String(totalCards).padStart(2, "0")}
            </span>
            <span className="font-serif text-lg text-white">{current.name}</span>
            {current.story && <span className="text-xs text-white/60 italic font-serif">&ldquo;{current.story}&rdquo;</span>}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {activeSarees.map((s, idx) => (
              <button key={s.id} type="button" onClick={() => rotateToCard(idx)} aria-label={`Show ${s.name}`} aria-current={activeIndex === idx} className="py-2">
                <div className={`h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? "w-8 sm:w-10 bg-[#C9A227]" : "w-2 sm:w-2.5 bg-white/20 hover:bg-white/50"}`} />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
            <button
              type="button"
              aria-pressed={isAutoplay}
              onClick={() => setIsAutoplay((p) => !p)}
              className={`px-3 py-1 rounded-full border transition-all text-[11px] ${isAutoplay ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}
            >
              {isAutoplay ? "Pause" : "Auto play"}
            </button>
            <Link href="/shop" className="text-[#C9A227] hover:text-[#d8b43d] tracking-wider uppercase text-[11px] font-medium">
              Explore Boutique →
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence>{selected && <DrapeDialog saree={selected} onClose={closeDialog} />}</AnimatePresence>
    </section>
  );
}
