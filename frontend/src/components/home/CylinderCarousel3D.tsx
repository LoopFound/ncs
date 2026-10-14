"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  animate,
  PanInfo,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export interface SignatureSaree {
  id: string;
  name: string;
  subtitle: string;
  collection: string;
  price: number;
  originalPrice: number;
  image: string;
  tag: string;
  craftTime: string;
  zari: string;
  fabric: string;
  weave: string;
  accentColor: string;
  goldAccent: string;
  description: string;
  motifs: string[];
  occasion: string;
  storySnippet: string;
}

export const SIGNATURE_SAREES: SignatureSaree[] = [
  {
    id: "leela-courtyard",
    name: "Leela Courtyard Silk",
    subtitle: "Archival Ochre & Vermilion Kanchi",
    collection: "Courtyard Heritage",
    price: 38500,
    originalPrice: 45000,
    image: "/images/looks/look-ivory.jpg",
    tag: "Heritage Edition",
    craftTime: "42 Days on Loom",
    zari: "Tested 24K Pure Gold Zari",
    fabric: "Pure Kanchipuram Mulberry Silk",
    weave: "Double Warp Korvai Handloom",
    accentColor: "#D4AF37",
    goldAccent: "#F5E6AB",
    description:
      "Inspired by the serene pillared courtyard verandas of ancestral Chettinad and Kanchi mansions. Hand-interlocked using the rare Korvai technique with intricate Annapakshi motifs and antique gold zari borders.",
    motifs: ["Annapakshi (Divine Swan)", "Mayilkan", "Temple Gopuram", "Floral Jaal"],
    occasion: "Receptions & Grand Festive Rituals",
    storySnippet: "Echoes of sacred courtyard temple lamps woven in liquid gold silk.",
  },
  {
    id: "tara-peacock",
    name: "Tara Peacock Paithani",
    subtitle: "Royal Azure & Meenakari Border",
    collection: "Imperial Avian Series",
    price: 46000,
    originalPrice: 54000,
    image: "/images/looks/look-blue.png",
    tag: "Signature Craft",
    craftTime: "52 Days on Loom",
    zari: "Silver-Gilt Tested Zari",
    fabric: "Pure Handloom Silk",
    weave: "Tapestry Weave with Korvai Temple Border",
    accentColor: "#1A5276",
    goldAccent: "#C9A227",
    description:
      "An aristocratic symphony of deep peacock navy silk adorned with dancing peacocks and intricate kaleidoscopic pallu. Woven with pure silk threads and gold-wrapped zari in celebratory meenakari colors.",
    motifs: ["Mor (Peacock)", "Asawali Creeper", "Muniya Border", "Lotus Medallion"],
    occasion: "Sangeet, Engagement & Gala Soirees",
    storySnippet: "Royal plumage rendered in jewel-toned azure and tested gold brocade.",
  },
  {
    id: "aarunya-emerald",
    name: "Aarunya Emerald Kanjivaram",
    subtitle: "Sacred Temple Gopuram Weave",
    collection: "Sacred Sanctuary Edit",
    price: 42000,
    originalPrice: 49000,
    image: "/images/looks/look-green.jpg",
    tag: "Masterpiece",
    craftTime: "38 Days on Loom",
    zari: "Pure Gold Plated Zari",
    fabric: "Heavy 4-Ply Mulberry Silk",
    weave: "Traditional Kancheepuram Handloom",
    accentColor: "#1E5E3A",
    goldAccent: "#E5C158",
    description:
      "Vibrant temple jade silk reflecting sacred Dravidian temple sanctums. Features intricate multi-tiered temple gopuram border patterns, accompanied by sacred Rudraksha and Kalash motifs.",
    motifs: ["Temple Gopuram", "Rudraksha", "Kalash", "Yali Crest"],
    occasion: "Pujas, Festive Receptions & Weddings",
    storySnippet: "A sacred sanctuary of temple architecture captured along heavy silk borders.",
  },
  {
    id: "rukmini-temple",
    name: "Rukmini Temple Silk",
    subtitle: "Heritage Mustard & Vermilion Korvai",
    collection: "Temple Classics",
    price: 36500,
    originalPrice: 43000,
    image: "/images/collections/kanchipuram.png",
    tag: "Archival Classic",
    craftTime: "35 Days on Loom",
    zari: "Traditional Ganga-Jamuna Gold",
    fabric: "Pure Kanchipuram Silk",
    weave: "Interlocking Weft Korvai Technique",
    accentColor: "#B8860B",
    goldAccent: "#F5DEB3",
    description:
      "Named after legendary temple lore, this piece features classic contrasting Ganga-Jamuna borders hand-interlocked with rich mustard mulberry silk, invoking the timeless poise of temple dancers.",
    motifs: ["Ganga-Jamuna Border", "Mango Booti", "Chakra", "Salangai"],
    occasion: "Family Ceremonies & Traditional Weddings",
    storySnippet: "Centuries of South Indian temple legacy woven into pure mulberry drape.",
  },
  {
    id: "saanjh-moon",
    name: "Saanjh Moon Banarasi",
    subtitle: "Blush Rose & Silver Moon Dust",
    collection: "Nocturne Opulence",
    price: 34000,
    originalPrice: 40000,
    image: "/images/looks/look-pink.jpg",
    tag: "Bestseller",
    craftTime: "45 Days on Loom",
    zari: "Antique Silver & Rose Gold Zari",
    fabric: "Soft Katan Silk",
    weave: "Kadwa Brocade Handloom",
    accentColor: "#B86B77",
    goldAccent: "#E8B4B8",
    description:
      "A dreamscape of delicate blush rose silk interwoven with antique silver floral jaal that catches evening candlelight with ethereal softness. Each individual flower motif is hand-engraved with Kadwa mastery.",
    motifs: ["Floral Jaal", "Chandra Booti", "Jangla", "Mughal Bel"],
    occasion: "Evening Cocktails, Sangeet & Receptions",
    storySnippet: "Moonlit silver threads dancing across evening blush petal silk.",
  },
  {
    id: "noor-wedding",
    name: "Noor Wedding Silk",
    subtitle: "Imperial Sindhoori Scarlet Pattu",
    collection: "Bridal Samudrika Series",
    price: 58000,
    originalPrice: 68000,
    image: "/images/looks/look-crimson.png",
    tag: "Royal Bridal",
    craftTime: "56 Days on Loom",
    zari: "Certified 24K Plated Pure Gold Zari",
    fabric: "Heavy 4-Ply Mulberry Silk",
    weave: "Bridal Samudrika Double Warp",
    accentColor: "#8B1E2D",
    goldAccent: "#E8B931",
    description:
      "The crowning jewel of the bridal trousseau. Saturated in sacred Sindhoori red, laden with intricate Mayilkan (peacock eye) motifs, and crowned with an opulent sweeping gold zari bridal pallu.",
    motifs: ["Mayilkan (Peacock Eye)", "Kodi Visiri", "Elephant Brocade", "Sun Medallion"],
    occasion: "Muhurtham & Auspicious Wedding Ceremonies",
    storySnippet: "The quintessential bridal heirloom, consecrated in scarlet silk and 24K zari.",
  },
  {
    id: "kalyani-brocade",
    name: "Kalyani Royal Brocade",
    subtitle: "Regal Magenta & Antique Brocade",
    collection: "Imperial Heritage",
    price: 48000,
    originalPrice: 56000,
    image: "/images/products/p1.png",
    tag: "Limited Edition",
    craftTime: "48 Days on Loom",
    zari: "Pure Silver with Gold Plating",
    fabric: "Pure Mulberry Silk",
    weave: "Handwoven Double Warp",
    accentColor: "#7D1D4A",
    goldAccent: "#D4AF37",
    description:
      "An aristocratic masterpiece in magenta silk, adorned with intricate temple-inspired zari relief work. Woven with double warp for incomparable luster and majestic drape.",
    motifs: ["Temple Border", "Annapakshi", "Brocade Jaal"],
    occasion: "Grand Receptions & Festive Weddings",
    storySnippet: "Regal magenta silk adorned with sculptural gold brocade motifs.",
  },
  {
    id: "chandrika-tissue",
    name: "Chandrika Ivory Tissue",
    subtitle: "Gossamer Ivory & Liquid Gold",
    collection: "Imperial Tissue Edit",
    price: 32000,
    originalPrice: 39000,
    image: "/images/collections/soft-silk.png",
    tag: "Summer Bridal",
    craftTime: "36 Days on Loom",
    zari: "Pure Gold Tissue Weave",
    fabric: "Silk Tissue Handloom",
    weave: "Fine Warp & Weft Metallic Silk",
    accentColor: "#C5A059",
    goldAccent: "#FAF0E6",
    description:
      "Gossamer-fine ivory silk tissue glowing with liquid gold brilliance. Lightweight yet dramatically opulent, designed for day weddings and intimate grand receptions.",
    motifs: ["Floral Buttas", "Scallop Zari Border", "Paisley"],
    occasion: "Daytime Weddings & Varmala Ceremonies",
    storySnippet: "Whisper-light ivory silk infused with radiant liquid gold threads.",
  },
];

interface CardProps {
  card: SignatureSaree;
  cardWidth: number;
  cardHeight: number;
  onExplore: (card: SignatureSaree) => void;
  hasDragged: boolean;
}

function CylinderCard({
  card,
  cardWidth,
  cardHeight,
  onExplore,
  hasDragged,
}: CardProps) {
  return (
    <motion.div
      key={card.id}
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
        backfaceVisibility: "hidden",
      }}
      className="select-none will-change-transform cursor-pointer group"
      onClick={() => {
        if (hasDragged) return;
        onExplore(card);
      }}
    >
      {/* 3D Card Shell */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-500 border ${
          "border-[#C9A227] shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_28px_rgba(201,162,39,0.28)] ring-1 ring-[#C9A227]/60"
        } bg-[#0A163B] flex flex-col`}
      >
        {/* Saree Portrait Image Container */}
        <div className="relative w-full h-full overflow-hidden">
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            onError={(e) => {
              // Graceful fallback to guarantee no broken image
              (e.target as HTMLImageElement).src = "/images/collections/wedding.png";
            }}
          />

          {/* Luxury Sheen Light Sweep on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Top Vignette Gradient */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

          {/* Bottom Dramatic Gradient for Typography Readability */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#060E26]/90 via-[#0B1B4D]/55 via-45% to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none z-10">
            {/* Tag Pill */}
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#F5F1E8] bg-[#0B1B4D]/85 backdrop-blur-md px-3 py-1 rounded-full border border-[#C9A227]/40 shadow-sm">
              {card.tag}
            </span>

            {/* Loom Time Seal */}
            <span className="text-[10px] tracking-wider text-[#C9A227] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#C9A227]/30 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
              {card.craftTime.split("•")[0]}
            </span>
          </div>

          {/* Card Corner Filigree Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#C9A227]/60 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#C9A227]/60 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#C9A227]/60 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#C9A227]/60 pointer-events-none" />

          {/* Bottom Card Content Info */}
          <div className="absolute bottom-0 inset-x-0 p-3.5 flex flex-col z-10">
            {/* Subtitle / Colorway */}
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A227] font-semibold mb-1">
              {card.subtitle}
            </span>

            {/* Saree Name */}
            <h3 className="font-[var(--font-serif)] text-lg text-white font-normal tracking-wide leading-tight group-hover:text-[#F3E5AB] transition-colors">
              {card.name}
            </h3>

            {/* Weave & Zari Specification */}
            <p className="text-[10px] text-white/70 line-clamp-1 mt-1 font-light tracking-wide">
              {card.weave} • {card.zari}
            </p>

            {/* Price & Action Row */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-medium text-[#F5F1E8]">
                    ₹{card.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-white/40 line-through">
                    ₹{card.originalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider text-[#C9A227]/80 block">
                  Heritage Handloom
                </span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExplore(card);
                }}
                className={`text-[11px] font-medium tracking-wider uppercase px-3.5 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                  "bg-[#C9A227] text-[#0B1B4D] hover:bg-[#d8b43d] shadow-[0_0_15px_rgba(201,162,39,0.5)] font-semibold"
                }`}
              >
                <span>Explore Drape</span>
                <svg
                  className="w-3 h-3 transform transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Card Bottom Glow Bar */}
        <div className="absolute -bottom-1 inset-x-6 h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent shadow-[0_0_10px_#C9A227]" />
      </div>
    </motion.div>
  );
}

export default function CylinderCarousel3D() {
  const [totalItemsCount, setTotalItemsCount] = useState<6 | 8>(6);
  const activeSarees = useMemo(() => {
    return totalItemsCount === 6 ? SIGNATURE_SAREES.slice(0, 6) : SIGNATURE_SAREES.slice(0, 8);
  }, [totalItemsCount]);

  const totalCards = activeSarees.length;
  const angleStep = 360 / totalCards;

  // Responsive radius of the cylinder in 3D space
  const [cardSize, setCardSize] = useState({ width: 230, height: 350 });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardSize({ width: 220, height: 340 });
      } else if (window.innerWidth < 1024) {
        setCardSize({ width: 225, height: 345 });
      } else {
        setCardSize({ width: 230, height: 350 });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [totalCards]);

  // Motion Values for continuous rotation & mouse perspective tilt
  const rotation = useMotionValue(0);
  const smoothRotation = useSpring(rotation, { stiffness: 100, damping: 22, mass: 0.8 });

  // Tracking active front card index
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = smoothRotation.on("change", (latest) => {
      const norm = Math.round((-latest / angleStep) % totalCards + totalCards) % totalCards;
      setActiveIndex(norm);
    });
    return () => unsubscribe();
  }, [smoothRotation, angleStep, totalCards]);

  // Drag interaction handling with inertia & snap
  const isDraggingRef = useRef(false);
  const [hasDragged, setHasDragged] = useState(false);
  const startRotationRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePanStart = () => {
    isDraggingRef.current = true;
    setHasDragged(false);
    setIsDragging(true);
    startRotationRef.current = rotation.get();
    setIsAutoplay(false);
  };

  const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 6 || Math.abs(info.offset.y) > 6) {
      setHasDragged(true);
    }
    // Sensitivity: 0.22 deg per pixel moved
    const newAngle = startRotationRef.current + info.offset.x * 0.22;
    rotation.set(newAngle);
  };

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    isDraggingRef.current = false;
    setIsDragging(false);

    // Apply inertia based on release velocity
    const inertiaAngle = info.velocity.x * 0.08;
    const projectedAngle = rotation.get() + inertiaAngle;

    // Snap to nearest card
    const snapAngle = Math.round(projectedAngle / angleStep) * angleStep;

    animate(rotation, snapAngle, {
      type: "spring",
      stiffness: 95,
      damping: 20,
      mass: 0.85,
    });

    // Reset drag flag after small delay to allow click isolation
    setTimeout(() => {
      setHasDragged(false);
    }, 80);
  };

  // Navigation button controls: Left (Prev) & Right (Next)
  const rotateToCard = useCallback(
    (index: number) => {
      const currentAngle = index * angleStep + rotation.get();
      const relAngle = ((currentAngle % 360) + 540) % 360 - 180;
      const target = rotation.get() - relAngle;

      animate(rotation, target, {
        type: "spring",
        stiffness: 110,
        damping: 22,
      });
    },
    [angleStep, rotation]
  );

  const handlePrev = useCallback(() => {
    setIsAutoplay(false);
    const currentSnap = Math.round(rotation.get() / angleStep) * angleStep;
    animate(rotation, currentSnap + angleStep, {
      type: "spring",
      stiffness: 110,
      damping: 22,
    });
  }, [angleStep, rotation]);

  const handleNext = useCallback(() => {
    setIsAutoplay(false);
    const currentSnap = Math.round(rotation.get() / angleStep) * angleStep;
    animate(rotation, currentSnap - angleStep, {
      type: "spring",
      stiffness: 110,
      damping: 22,
    });
  }, [angleStep, rotation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrev, handleNext]);

  // Optional Autoplay
  useEffect(() => {
    if (!isAutoplay || isHovered || isDragging) return;
    const timer = setInterval(() => {
      const currentSnap = Math.round(rotation.get() / angleStep) * angleStep;
      animate(rotation, currentSnap - angleStep, {
        type: "spring",
        stiffness: 90,
        damping: 22,
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [isAutoplay, isHovered, isDragging, angleStep, rotation]);

  // Modal / Detail Spotlight state
  const [selectedSaree, setSelectedSaree] = useState<SignatureSaree | null>(null);

  const cart = useCart();

  const [addedToast, setAddedToast] = useState<string | null>(null);
  const handleAddToCart = (saree: SignatureSaree) => {
    cart.addToCart({
        id: saree.id,
        name: saree.name,
        price: saree.price,
        image: saree.image,
        category: saree.collection,
    });
    setAddedToast(saree.name);
    setTimeout(() => setAddedToast(null), 3500);
  };

  const currentActiveSaree = activeSarees[activeIndex] || activeSarees[0];

  return (
    <section
      onMouseLeave={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      className="relative py-20 lg:py-28 bg-gradient-to-b from-[#050C24] via-[#091538] to-[#04091A] text-white overflow-hidden border-y border-[#C9A227]/25"
      aria-label="3D Cylindrical Saree Carousel"
    >
      {/* Background Decorative Gold Motifs & Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Central Radial Golden Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(201,162,39,0.15)_0%,_rgba(11,27,77,0.3)_45%,_transparent_75%)] blur-2xl" />

        {/* Top & Bottom Subtle Shimmers */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/40 to-transparent" />

        {/* Intricate Geometric Heritage Lattice Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#C9A227 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-10 lg:mb-14"
        >
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#C9A227] text-[11px] sm:text-xs font-semibold tracking-[0.35em] uppercase mb-4 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
            THE DRIFT SIGNATURES
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
          </div>

          {/* Signature Title with 'Remembered' in Italic Gold Script */}
          <h2 className="font-[var(--font-serif)] text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-none mb-4">
            Woven to Be{" "}
            <span className="italic font-normal text-[#C9A227] font-serif relative inline-block drop-shadow-[0_2px_12px_rgba(201,162,39,0.3)]">
              Remembered
              {/* Subtle underline gold arc */}
              <span className="absolute -bottom-1.5 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C9A227] to-transparent opacity-80" />
            </span>
          </h2>

          {/* Description */}
          <p className="text-sm sm:text-base text-[#E5E5E5]/75 font-light leading-relaxed max-w-xl mx-auto">
            An archival curation of heirloom weaves, each draped in centuries of Kanchipuram
            tradition, master artisan devotion, and celestial 24K gold zari.
          </p>

          {/* Toggle between 6 Signatures & 8 Collection items */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-white/50">Curated View:</span>
            <div className="inline-flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setTotalItemsCount(6)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  totalItemsCount === 6
                    ? "bg-[#C9A227] text-[#0B1B4D] font-semibold shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                6 Signatures
              </button>
              <button
                type="button"
                onClick={() => setTotalItemsCount(8)}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  totalItemsCount === 8
                    ? "bg-[#C9A227] text-[#0B1B4D] font-semibold shadow-sm"
                    : "text-white/70 hover:text-white"
                }`}
              >
                8 All-Stars
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3D Cylindrical Carousel Viewport Stage */}
        <div className="relative w-full max-w-6xl mx-auto flex items-center justify-center">
          {/* Left Arrow Navigation Control */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous signature drape"
            className="absolute left-2 sm:left-6 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#0B1B4D]/85 hover:bg-[#0B1B4D] border border-[#C9A227]/40 hover:border-[#C9A227] text-[#C9A227] shadow-[0_8px_25px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transform transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow Navigation Control */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next signature drape"
            className="absolute right-2 sm:right-6 z-40 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-[#0B1B4D]/85 hover:bg-[#0B1B4D] border border-[#C9A227]/40 hover:border-[#C9A227] text-[#C9A227] shadow-[0_8px_25px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transform transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Interactive Drag & Swipe Stage */}
          <motion.div
            className={`relative w-full h-[390px] sm:h-[410px] md:h-[430px] flex items-center justify-center overflow-visible touch-pan-y ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onPanStart={handlePanStart}
            onPan={handlePan}
            onPanEnd={handlePanEnd}
            style={{
              perspective: 1200,
              perspectiveOrigin: "50% 50%",
            }}
          >
            {/* Ground / Stage Reflection Disk */}
            <div className="absolute bottom-6 w-[500px] sm:w-[700px] md:w-[900px] h-[90px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,_rgba(201,162,39,0.22)_0%,_rgba(11,27,77,0.5)_40%,_transparent_75%)] blur-2xl pointer-events-none transform -rotate-x-60" />

            {/* Single active saree */}
            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                <CylinderCard
                  key={currentActiveSaree.id}
                  card={currentActiveSaree}
                  cardWidth={cardSize.width}
                  cardHeight={cardSize.height}
                  onExplore={setSelectedSaree}
                  hasDragged={hasDragged}
                />
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom Interactive Navigation Bar & Status */}
        <div className="mt-8 flex flex-col items-center justify-center gap-6">
          {/* Active Card Title & Story Preview */}
          <div className="text-center min-h-[44px]">
            <motion.div
              key={currentActiveSaree.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-light text-white/90"
            >
              <span className="text-[#C9A227] font-mono text-xs uppercase tracking-widest bg-[#C9A227]/10 px-2.5 py-0.5 rounded border border-[#C9A227]/25">
                {String(activeIndex + 1).padStart(2, "0")} / {String(totalCards).padStart(2, "0")}
              </span>
              <span className="font-[var(--font-serif)] text-lg text-white font-normal">
                {currentActiveSaree.name}
              </span>
              <span className="hidden sm:inline text-white/30">•</span>
              <span className="text-xs text-white/60 italic font-serif">
                &ldquo;{currentActiveSaree.storySnippet}&rdquo;
              </span>
            </motion.div>
          </div>

          {/* Dots / Pagination Pills */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {activeSarees.map((s, idx) => {
              const isActive = activeIndex === idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => rotateToCard(idx)}
                  aria-label={`Jump to ${s.name}`}
                  className="group relative py-2 focus:outline-none"
                >
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 sm:w-10 bg-[#C9A227] shadow-[0_0_10px_#C9A227]"
                        : "w-2 sm:w-2.5 bg-white/20 group-hover:bg-white/50"
                    }`}
                  />
                  {/* Tooltip on Hover */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-[#0B1B4D] text-[10px] text-[#C9A227] border border-[#C9A227]/40 px-2 py-0.5 rounded shadow-lg pointer-events-none">
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Utility Controls: Autoplay, Hint, Full Catalog Link */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
            {/* Drag Gesture Hint */}
            <div className="flex items-center gap-1.5 text-white/40 tracking-wider uppercase text-[10px]">
              <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Drag / Swipe or Arrow Keys to Orbit</span>
            </div>

            <span className="hidden sm:inline text-white/20">|</span>

            {/* Autoplay Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoplay((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-[11px] ${
                isAutoplay
                  ? "bg-[#C9A227]/20 border-[#C9A227] text-[#C9A227]"
                  : "bg-white/5 border-white/10 hover:border-white/30 text-white/60 hover:text-white"
              }`}
            >
              {isAutoplay ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#C9A227] animate-ping" />
                  <span>Orbit Playing</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-[#C9A227]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Auto Orbit</span>
                </>
              )}
            </button>

            <span className="hidden sm:inline text-white/20">|</span>

            {/* Link to Shop All Collection */}
            <Link
              href="/shop"
              className="text-[#C9A227] hover:text-[#d8b43d] tracking-wider uppercase text-[11px] font-medium flex items-center gap-1 group"
            >
              <span>Explore Boutique</span>
              <svg
                className="w-3.5 h-3.5 transform transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Luxury Quick View / Drape Spotlight Modal */}
      <AnimatePresence>
        {selectedSaree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSaree(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Content Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-[#0B1B4D] via-[#091538] to-[#040A1C] border border-[#C9A227]/40 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] z-10 my-8 text-white"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedSaree(null)}
                aria-label="Close detail modal"
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C9A227] text-white hover:text-[#0B1B4D] border border-white/20 transition-all flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="grid md:grid-cols-2">
                {/* Left: Full Length Drape Portrait */}
                <div className="relative aspect-[3/4] md:aspect-auto md:h-full min-h-[380px] bg-black/40 overflow-hidden">
                  <img
                    src={selectedSaree.image}
                    alt={selectedSaree.name}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/collections/wedding.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B4D] via-transparent to-transparent md:hidden" />
                  <div className="absolute top-4 left-4">
                    <span className="text-xs uppercase tracking-widest text-[#0B1B4D] font-bold bg-[#C9A227] px-3 py-1 rounded-full shadow">
                      {selectedSaree.tag}
                    </span>
                  </div>
                </div>

                {/* Right: Detailed Craftsmanship & Purchase Specs */}
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-[0.25em] text-[#C9A227] font-semibold block mb-1">
                      {selectedSaree.collection}
                    </span>
                    <h3 className="font-[var(--font-serif)] text-3xl sm:text-4xl text-white font-normal mb-2">
                      {selectedSaree.name}
                    </h3>
                    <p className="text-xs text-[#C9A227] tracking-wider uppercase mb-4">
                      {selectedSaree.subtitle}
                    </p>

                    <p className="text-sm text-white/80 leading-relaxed font-light mb-6">
                      {selectedSaree.description}
                    </p>

                    {/* Technical Specifications Grid */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs mb-6">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase tracking-wider">Fabric</span>
                        <span className="text-white/90 font-medium">{selectedSaree.fabric}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase tracking-wider">Zari</span>
                        <span className="text-[#C9A227] font-medium">{selectedSaree.zari}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase tracking-wider">Weave</span>
                        <span className="text-white/90 font-medium">{selectedSaree.weave}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase tracking-wider">Loom Time</span>
                        <span className="text-white/90 font-medium">{selectedSaree.craftTime}</span>
                      </div>
                    </div>

                    {/* Sacred Motifs Chips */}
                    <div className="mb-6">
                      <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-2">
                        Sacred Motifs Woven:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSaree.motifs.map((motif, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#C9A227]/10 text-[#C9A227] border border-[#C9A227]/25"
                          >
                            ✦ {motif}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA Section */}
                  <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                          ₹{selectedSaree.price.toLocaleString("en-IN")}
                        </span>
                        <span className="text-sm text-white/40 line-through">
                          ₹{selectedSaree.originalPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium block">
                        Complimentary Insured Pan-India & Global Express Shipping
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(selectedSaree)}
                        className="flex-1 sm:flex-initial px-6 py-3 rounded-full bg-[#C9A227] hover:bg-[#d8b43d] text-[#0B1B4D] font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(201,162,39,0.4)] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span>Acquire Drape</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Added to Bag Toast Notification */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-8 left-1/2 z-50 bg-[#0B1B4D] text-white border border-[#C9A227] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A227] animate-ping" />
            <span className="text-xs">
              <strong className="text-[#C9A227]">{addedToast}</strong> added to your collection bag.
            </span>
            <Link
              href="/cart"
              className="text-xs uppercase tracking-wider text-[#C9A227] underline font-semibold ml-2 hover:text-white"
            >
              View Bag
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
