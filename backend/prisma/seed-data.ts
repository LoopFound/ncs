// Catalog content migrated from the original hard-coded front-end sources
// (src/data/mock.ts, CylinderCarousel3D SIGNATURE_SAREES, src/data/drapeLooks.ts,
// FeaturedProducts.tsx). Prices are in rupees here and converted to paise by the seed.

export interface SeedCategory {
  path: string;
  name: string;
  description: string;
  image?: string;
  sortOrder: number;
}

export const categories: SeedCategory[] = [
  { path: "wedding", name: "Wedding Silks", description: "Handwoven masterpieces for the bride and her entourage.", image: "/images/collections/wedding.png", sortOrder: 1 },
  { path: "kanchipuram", name: "Kanchipuram", description: "The authentic weave of Kanchipuram, preserved in its purest form.", image: "/images/collections/kanchipuram.png", sortOrder: 2 },
  { path: "kanchipuram/traditional", name: "Traditional", description: "Heirloom Korvai weaves with temple borders and classic motifs.", sortOrder: 1 },
  { path: "kanchipuram/borderless", name: "Borderless", description: "Contemporary all-over zari bodies without a border.", sortOrder: 2 },
  { path: "kanchipuram/fancy-kanjivarams", name: "Fancy Kanjivarams", description: "Heritage texture meets modern dual-tone and geometric design.", sortOrder: 3 },
  { path: "kanchipuram/exclusives", name: "Exclusives", description: "Collector pieces woven in limited numbers.", sortOrder: 4 },
  { path: "soft-silk", name: "Soft Silks", description: "Contemporary lightweight silks for effortless elegance.", image: "/images/collections/soft-silk.png", sortOrder: 3 },
  { path: "gift-sarees", name: "Gift Sarees", description: "Thoughtful tokens of tradition for your loved ones.", sortOrder: 4 },
  { path: "pavadas", name: "Pavadas", description: "Pure silk pattu pavada sets for girls.", sortOrder: 5 },
  { path: "dupattas", name: "Dupattas", description: "Handwoven silk dupattas and stoles.", sortOrder: 6 },
  { path: "mens-corner", name: "Men's Corner", description: "Pure silk veshtis, dhotis and angavastrams.", sortOrder: 7 },
  { path: "materials", name: "Materials", description: "Running silk yardage for blouses, sherwanis and more.", sortOrder: 8 },
];

export interface SeedProduct {
  slug: string;
  name: string;
  subtitle?: string;
  category: string; // category path
  price: number; // rupees, GST inclusive
  compareAtPrice?: number;
  description: string;
  story?: string;
  collection?: string;
  fabric?: string;
  weave?: string;
  zari?: string;
  occasion?: string;
  colorName?: string;
  colorHex?: string;
  craftTime?: string;
  details: string[];
  motifs?: string[];
  tags: string[];
  images: string[];
  featured?: boolean;
  signature?: boolean;
  newArrival?: boolean;
  unit?: "PIECE" | "METRE";
  stock?: number;
}

export const products: SeedProduct[] = [
  // ── from src/data/mock.ts ──────────────────────────────────
  {
    slug: "royal-kanchipuram-silk", name: "Royal Kanchipuram Silk", category: "wedding", price: 45000, compareAtPrice: 52000,
    description: "A masterpiece in pure mulberry silk, featuring intricate zari work inspired by temple architecture. This Kanchipuram saree is woven with double warp for enhanced durability and sheen.",
    fabric: "Pure Mulberry Silk", weave: "Handwoven Double Warp", zari: "Pure Silver with Gold Plating", occasion: "Wedding & Bridal",
    details: ["Material: Pure Mulberry Silk", "Weave: Handwoven Double Warp", "Zari: Pure Silver with Gold Plating", "Occasion: Wedding & Bridal", "Care: Dry Clean Only"],
    images: ["/images/collections/Gemini_Generated_Image_a504fwa504fwa504.png", "/images/products/p1.png", "/images/looks/look-blue.png"],
    tags: ["Bridal", "Heavy Work", "Traditional", "Exclusives"], featured: true, newArrival: true,
  },
  {
    slug: "classic-gold-border-pattu", name: "Classic Gold Border Pattu", category: "kanchipuram", price: 38000,
    description: "Timeless elegance defined by a broad gold border against a rich contrasting body. Perfect for festive occasions and traditional ceremonies.",
    fabric: "Pure Silk", weave: "Traditional Korvai", zari: "Tested Zari", occasion: "Festivals",
    details: ["Material: Pure Silk", "Weave: Traditional Korvai", "Zari: Tested Zari", "Occasion: Festivals", "Care: Dry Clean Only"],
    images: ["/images/collections/Gemini_Generated_Image_bhmtv9bhmtv9bhmt.png", "/images/products/p2.png", "/images/collections/kanchipuram.png"],
    tags: ["Festive", "Classic", "Bestseller", "Traditional"], featured: true, newArrival: true,
  },
  {
    slug: "soft-silk-pastel-dreams", name: "Soft Silk Pastel Dreams", category: "soft-silk", price: 18500,
    description: "Lightweight and easy to drape, this soft silk saree comes in a contemporary pastel shade, ideal for day events and semi-formal gatherings.",
    fabric: "Soft Silk", weave: "Lightweight Handloom", zari: "Half Fine Zari", occasion: "Party Wear",
    details: ["Material: Soft Silk", "Weave: Lightweight Handloom", "Zari: Half Fine Zari", "Occasion: Party Wear", "Care: Dry Clean Only"],
    images: ["/images/collections/Gemini_Generated_Image_vdqny5vdqny5vdqn.png", "/images/collections/soft-silk.png", "/images/looks/look-pink.jpg"],
    tags: ["Modern", "Lightweight", "Pastel"], featured: true, newArrival: true,
  },
  {
    slug: "temple-zari-weave", name: "Temple Zari Weave", category: "wedding", price: 55000,
    description: "Richly woven with traditional temple borders, this saree represents the pinnacle of Kanchipuram craftsmanship.",
    fabric: "Pure Silk", weave: "Heavy Bridal Weave", zari: "High Quality Pure Zari", occasion: "Grand Weddings",
    details: ["Material: Pure Silk", "Weave: Heavy Bridal Weave", "Zari: High Quality Pure Zari", "Occasion: Grand Weddings", "Care: Dry Clean Only"],
    images: ["/images/collections/Gemini_Generated_Image_vkgvmnvkgvmnvkgv.png", "/images/collections/wedding.png", "/images/looks/look-crimson.png"],
    tags: ["Grand", "Temple Border", "Exclusive"], featured: true,
  },
  {
    slug: "vintage-green-handloom", name: "Vintage Green Handloom", category: "kanchipuram", price: 32000,
    description: "A vintage-inspired shade of green with contrasting border, bringing back the charm of old-school Madras elegance.",
    fabric: "Handloom Silk", weave: "Traditional Korvai", zari: "Antique Finish", occasion: "Traditional Events",
    details: ["Material: Handloom Silk", "Weave: Traditional Korvai", "Zari: Antique Finish", "Occasion: Traditional Events", "Care: Dry Clean Only"],
    images: ["/images/looks/look-green.jpg", "/images/collections/kanchipuram.png"],
    tags: ["Vintage", "Handloom", "Elegant"],
  },
  {
    slug: "bridal-red-samudrika", name: "Bridal Red Samudrika", category: "wedding", price: 65000,
    description: "The quintessential bridal red saree, adorned with intricate motifs symbolizing prosperity and auspicious beginnings.",
    fabric: "Pure Mulberry Silk", weave: "Bridal Samudrika", zari: "Pure Gold Zari", occasion: "Muhurtham",
    details: ["Material: Pure Mulberry Silk", "Weave: Bridal Samudrika", "Zari: Pure Gold Zari", "Occasion: Muhurtham", "Care: Dry Clean Only"],
    images: ["/images/hero/hero-model.png", "/images/looks/look-crimson.png"],
    tags: ["Bridal Red", "Premium", "Heavy"], newArrival: true,
  },
  {
    slug: "mustard-korvai-silk", name: "Auspicious Mustard Korvai Silk", category: "kanchipuram/traditional", price: 42000,
    description: "Pure heirloom Kanchipuram handwoven in sacred turmeric yellow with contrast maroon Korvai borders and Mayil (peacock) buttas.",
    fabric: "100% Pure Mulberry Silk", weave: "Interlocking Korvai Petni", zari: "Authentic Silver Tested Zari", occasion: "Seemandham, Temple Festivals",
    details: ["Material: 100% Pure Mulberry Silk", "Weave: Interlocking Korvai Petni", "Zari: Authentic Silver Tested Zari", "Occasion: Seemandham, Temple Festivals", "Care: Dry Clean Only"],
    images: ["/images/looks/look-ivory.jpg", "/images/products/p1.png"],
    tags: ["Korvai", "Bestseller"],
  },
  {
    slug: "ethereal-borderless-kanjivaram", name: "Ethereal Borderless Kanjivaram", category: "kanchipuram/borderless", price: 36000,
    description: "A contemporary drape with no border, allowing the seamless all-over zari jacquard body and majestic pallu to take centre stage.",
    fabric: "Pure Soft Kanchipuram Silk", weave: "Borderless Jacquard", zari: "Subtle Muted Rose-Gold Zari", occasion: "Receptions, Sangeet",
    details: ["Material: Pure Soft Kanchipuram Silk", "Weave: Borderless Jacquard", "Zari: Subtle Muted Rose-Gold Zari", "Occasion: Receptions, Sangeet", "Care: Dry Clean Only"],
    images: ["/images/looks/look-pink.jpg", "/images/collections/soft-silk.png"],
    tags: ["Modern"], newArrival: true,
  },
  {
    slug: "pastel-dual-tone-kanjivaram", name: "Pastel Dual-Tone Fancy Kanjivaram", category: "kanchipuram/fancy-kanjivarams", price: 29500,
    description: "An innovative weave blending heritage Kanchipuram texture with modern dual-tone shot silk hues and geometric motifs.",
    fabric: "Shot Pure Silk", weave: "Contemporary Fancy Loom", zari: "Copper & Champagne Zari", occasion: "Cocktail, Festive Gatherings",
    details: ["Material: Shot Pure Silk", "Weave: Contemporary Fancy Loom", "Zari: Copper & Champagne Zari", "Occasion: Cocktail, Festive Gatherings", "Care: Dry Clean Only"],
    images: ["/images/looks/look-blue.png", "/images/collections/soft-silk.png"],
    tags: ["Fancy"], newArrival: true,
  },
  {
    slug: "thousand-butta-kanjivaram", name: "Heritage Thousand Butta Kanjivaram", category: "kanchipuram/exclusives", price: 88000,
    description: "A collector's item featuring the legendary Aayiram Butta (1,000 motifs) individually woven with silver and gold zari across 45 days.",
    fabric: "Grade-A Pure Mulberry Silk", weave: "Aayiram Butta Masterpiece", zari: "Real Silver & 24K Gold Zari", occasion: "Royal Weddings, Heirlooms",
    details: ["Material: Grade-A Pure Mulberry Silk", "Weave: Aayiram Butta Masterpiece", "Zari: Real Silver & 24K Gold Zari", "Occasion: Royal Weddings, Heirlooms", "Care: Dry Clean Only"],
    images: ["/images/collections/kanchipuram.png", "/images/products/p1.png"],
    tags: ["Collector", "Bridal"], stock: 1,
  },
  {
    slug: "festive-shrimathi-gift-silk", name: "Festive Shrimathi Gift Silk Saree", category: "gift-sarees", price: 12500,
    description: "A lightweight pure silk saree thoughtfully curated for gifting during auspicious occasions, housewarmings, and wedding thamboolam.",
    fabric: "Pure Silk Warp", weave: "Light Handloom", occasion: "Gifting, Varalakshmi Pooja",
    details: ["Material: Pure Silk Warp", "Weave: Light Handloom", "Packaging: Complimentary Heritage Gift Box", "Occasion: Gifting, Varalakshmi Pooja", "Care: Dry Clean Only"],
    images: ["/images/collections/soft-silk.png", "/images/looks/look-pink.jpg"],
    tags: ["Gifts", "Festive", "Bestseller"],
  },
  {
    slug: "kalyani-shagun-silk", name: "Kalyani Shagun Silk Saree", category: "gift-sarees", price: 15800,
    description: "Adorned with sweet temple borders and delicate floral vines, accompanied by a customized festive gift card.",
    fabric: "Soft Pure Silk", weave: "Festive Loom", occasion: "Weddings, Anniversaries",
    details: ["Material: Soft Pure Silk", "Weave: Festive Loom", "Packaging: Gold Ribbon Box Included", "Occasion: Weddings, Anniversaries", "Care: Dry Clean Only"],
    images: ["/images/looks/look-green.jpg", "/images/collections/wedding.png"],
    tags: ["Gifts"], newArrival: true,
  },
  {
    slug: "kanchipuram-pattu-pavada-girls", name: "Pure Silk Kanchipuram Pattu Pavada", category: "pavadas", price: 14500,
    description: "Handcrafted pure silk lehenga / pavada material set with rich traditional zari border for auspicious family celebrations.",
    fabric: "100% Pure Kanchipuram Silk", zari: "Gold Brocade Borders", occasion: "Upanayanam, Temple Festivals, Diwali",
    details: ["Material: 100% Pure Kanchipuram Silk", "Component: Skirt fabric + Blouse fabric", "Zari: Gold Brocade Borders", "Occasion: Upanayanam, Temple Festivals, Diwali", "Care: Dry Clean Only"],
    images: ["/images/looks/look-pink.jpg", "/images/collections/wedding.png"],
    tags: ["Kids", "Festive"],
  },
  {
    slug: "kanchipuram-silk-dupatta", name: "Handwoven Kanchipuram Silk Dupatta", category: "dupattas", price: 9800,
    description: "An opulent pure silk stole adorned with intricate zari pallu and fringe tassels, perfect to elevate any anarkali or kurta.",
    fabric: "Pure Mulberry Silk", zari: "Fine Gold Zari Weave", occasion: "Festive Wear, Receptions",
    details: ["Material: Pure Mulberry Silk", "Length: 2.5 Metres", "Zari: Fine Gold Zari Weave", "Occasion: Festive Wear, Receptions", "Care: Dry Clean Only"],
    images: ["/images/looks/look-ivory.jpg", "/images/collections/soft-silk.png"],
    tags: ["Stole"], newArrival: true,
  },
  {
    slug: "mayilkan-pure-silk-dhoti-set", name: "Royal Pure Silk Mayilkan Dhoti & Angavastram", category: "mens-corner", price: 16500,
    description: "Authentic double-warp pure silk dhoti (Veshti) with matching Angavastram featuring auspicious Mayilkan (peacock eye) gold zari border.",
    fabric: "100% Pure Mulberry Silk", zari: "Pure Tested Gold Zari", occasion: "Groom's Muhurtham, Poojas, Festive",
    details: ["Material: 100% Pure Mulberry Silk", "Size: 8 x 4 Muzham (Double Dhoti + Towel)", "Zari: Pure Tested Gold Zari", "Occasion: Groom's Muhurtham, Poojas, Festive", "Care: Dry Clean Only"],
    images: ["/images/looks/look-ivory.jpg", "/images/products/p1.png"],
    tags: ["Dhoti", "Veshti"], newArrival: true,
  },
  {
    slug: "pure-kanchipuram-brocade-fabric", name: "Pure Kanchipuram Brocade Silk Fabric", category: "materials", price: 4500,
    description: "Running pure silk brocade yardage woven with dense floral jaal work, ideal for bridal blouses, sherwanis, or customized jackets. Priced per metre.",
    fabric: "Pure Handloom Silk", zari: "Metallic Gold Threaded",
    details: ["Material: Pure Handloom Silk", "Width: 44 Inches", "Pricing: Per Metre", "Zari: Metallic Gold Threaded", "Care: Dry Clean Only"],
    images: ["/images/looks/look-green.jpg", "/images/collections/kanchipuram.png"],
    tags: ["Fabric", "Blouse Material", "Yardage"], unit: "METRE", stock: 120,
  },

  // ── from CylinderCarousel3D SIGNATURE_SAREES ───────────────
  {
    slug: "leela-courtyard-silk", name: "Leela Courtyard Silk", subtitle: "Archival Ochre & Vermilion Kanchi", collection: "Courtyard Heritage",
    category: "kanchipuram/traditional", price: 38500, compareAtPrice: 45000, craftTime: "42 Days on Loom",
    zari: "Tested 24K Pure Gold Zari", fabric: "Pure Kanchipuram Mulberry Silk", weave: "Double Warp Korvai Handloom", colorHex: "#D4AF37",
    description: "Inspired by the serene pillared courtyard verandas of ancestral Chettinad and Kanchi mansions. Hand-interlocked using the rare Korvai technique with intricate Annapakshi motifs and antique gold zari borders.",
    story: "Echoes of sacred courtyard temple lamps woven in liquid gold silk.",
    motifs: ["Annapakshi (Divine Swan)", "Mayilkan", "Temple Gopuram", "Floral Jaal"], occasion: "Receptions & Grand Festive Rituals",
    details: [], tags: ["Heritage Edition"], images: ["/images/looks/look-ivory.jpg"], signature: true,
  },
  {
    slug: "tara-peacock-paithani", name: "Tara Peacock Paithani", subtitle: "Royal Azure & Meenakari Border", collection: "Imperial Avian Series",
    category: "wedding", price: 46000, compareAtPrice: 54000, craftTime: "52 Days on Loom",
    zari: "Silver-Gilt Tested Zari", fabric: "Pure Handloom Silk", weave: "Tapestry Weave with Korvai Temple Border", colorHex: "#1A5276",
    description: "An aristocratic symphony of deep peacock navy silk adorned with dancing peacocks and intricate kaleidoscopic pallu. Woven with pure silk threads and gold-wrapped zari in celebratory meenakari colors.",
    story: "Royal plumage rendered in jewel-toned azure and tested gold brocade.",
    motifs: ["Mor (Peacock)", "Asawali Creeper", "Muniya Border", "Lotus Medallion"], occasion: "Sangeet, Engagement & Gala Soirees",
    details: [], tags: ["Signature Craft"], images: ["/images/looks/look-blue.png"], signature: true,
  },
  {
    slug: "aarunya-emerald-kanjivaram", name: "Aarunya Emerald Kanjivaram", subtitle: "Sacred Temple Gopuram Weave", collection: "Sacred Sanctuary Edit",
    category: "kanchipuram/traditional", price: 42000, compareAtPrice: 49000, craftTime: "38 Days on Loom",
    zari: "Pure Gold Plated Zari", fabric: "Heavy 4-Ply Mulberry Silk", weave: "Traditional Kancheepuram Handloom", colorHex: "#1E5E3A",
    description: "Vibrant temple jade silk reflecting sacred Dravidian temple sanctums. Features intricate multi-tiered temple gopuram border patterns, accompanied by sacred Rudraksha and Kalash motifs.",
    story: "A sacred sanctuary of temple architecture captured along heavy silk borders.",
    motifs: ["Temple Gopuram", "Rudraksha", "Kalash", "Yali Crest"], occasion: "Pujas, Festive Receptions & Weddings",
    details: [], tags: ["Masterpiece"], images: ["/images/looks/look-green.jpg"], signature: true,
  },
  {
    slug: "rukmini-temple-silk", name: "Rukmini Temple Silk", subtitle: "Heritage Mustard & Vermilion Korvai", collection: "Temple Classics",
    category: "kanchipuram/traditional", price: 36500, compareAtPrice: 43000, craftTime: "35 Days on Loom",
    zari: "Traditional Ganga-Jamuna Gold", fabric: "Pure Kanchipuram Silk", weave: "Interlocking Weft Korvai Technique", colorHex: "#B8860B",
    description: "Named after legendary temple lore, this piece features classic contrasting Ganga-Jamuna borders hand-interlocked with rich mustard mulberry silk, invoking the timeless poise of temple dancers.",
    story: "Centuries of South Indian temple legacy woven into pure mulberry drape.",
    motifs: ["Ganga-Jamuna Border", "Mango Booti", "Chakra", "Salangai"], occasion: "Family Ceremonies & Traditional Weddings",
    details: [], tags: ["Archival Classic"], images: ["/images/collections/kanchipuram.png"], signature: true,
  },
  {
    slug: "saanjh-moon-banarasi", name: "Saanjh Moon Banarasi", subtitle: "Blush Rose & Silver Moon Dust", collection: "Nocturne Opulence",
    category: "wedding", price: 34000, compareAtPrice: 40000, craftTime: "45 Days on Loom",
    zari: "Antique Silver & Rose Gold Zari", fabric: "Soft Katan Silk", weave: "Kadwa Brocade Handloom", colorHex: "#B86B77",
    description: "A dreamscape of delicate blush rose silk interwoven with antique silver floral jaal that catches evening candlelight with ethereal softness. Each individual flower motif is hand-engraved with Kadwa mastery.",
    story: "Moonlit silver threads dancing across evening blush petal silk.",
    motifs: ["Floral Jaal", "Chandra Booti", "Jangla", "Mughal Bel"], occasion: "Evening Cocktails, Sangeet & Receptions",
    details: [], tags: ["Bestseller"], images: ["/images/looks/look-pink.jpg"], signature: true,
  },
  {
    slug: "noor-wedding-silk", name: "Noor Wedding Silk", subtitle: "Imperial Sindhoori Scarlet Pattu", collection: "Bridal Samudrika Series",
    category: "wedding", price: 58000, compareAtPrice: 68000, craftTime: "56 Days on Loom",
    zari: "Certified 24K Plated Pure Gold Zari", fabric: "Heavy 4-Ply Mulberry Silk", weave: "Bridal Samudrika Double Warp", colorHex: "#8B1E2D",
    description: "The crowning jewel of the bridal trousseau. Saturated in sacred Sindhoori red, laden with intricate Mayilkan (peacock eye) motifs, and crowned with an opulent sweeping gold zari bridal pallu.",
    story: "The quintessential bridal heirloom, consecrated in scarlet silk and 24K zari.",
    motifs: ["Mayilkan (Peacock Eye)", "Kodi Visiri", "Elephant Brocade", "Sun Medallion"], occasion: "Muhurtham & Auspicious Wedding Ceremonies",
    details: [], tags: ["Royal Bridal"], images: ["/images/looks/look-crimson.png"], signature: true,
  },
  {
    slug: "kalyani-royal-brocade", name: "Kalyani Royal Brocade", subtitle: "Regal Magenta & Antique Brocade", collection: "Imperial Heritage",
    category: "kanchipuram/exclusives", price: 48000, compareAtPrice: 56000, craftTime: "48 Days on Loom",
    zari: "Pure Silver with Gold Plating", fabric: "Pure Mulberry Silk", weave: "Handwoven Double Warp", colorHex: "#7D1D4A",
    description: "An aristocratic masterpiece in magenta silk, adorned with intricate temple-inspired zari relief work. Woven with double warp for incomparable luster and majestic drape.",
    story: "Regal magenta silk adorned with sculptural gold brocade motifs.",
    motifs: ["Temple Border", "Annapakshi", "Brocade Jaal"], occasion: "Grand Receptions & Festive Weddings",
    details: [], tags: ["Limited Edition"], images: ["/images/products/p1.png"], signature: true,
  },
  {
    slug: "chandrika-ivory-tissue", name: "Chandrika Ivory Tissue", subtitle: "Gossamer Ivory & Liquid Gold", collection: "Imperial Tissue Edit",
    category: "wedding", price: 32000, compareAtPrice: 39000, craftTime: "36 Days on Loom",
    zari: "Pure Gold Tissue Weave", fabric: "Silk Tissue Handloom", weave: "Fine Warp & Weft Metallic Silk", colorHex: "#C5A059",
    description: "Gossamer-fine ivory silk tissue glowing with liquid gold brilliance. Lightweight yet dramatically opulent, designed for day weddings and intimate grand receptions.",
    story: "Whisper-light ivory silk infused with radiant liquid gold threads.",
    motifs: ["Floral Buttas", "Scallop Zari Border", "Paisley"], occasion: "Daytime Weddings & Varmala Ceremonies",
    details: [], tags: ["Summer Bridal"], images: ["/images/collections/soft-silk.png"], signature: true,
  },

  // ── from src/data/drapeLooks.ts (previously unused) ────────
  {
    slug: "ivory-organza-bloom", name: "Ivory Organza Bloom", subtitle: "Woven with 24K Pure Gold Zari Bootis", collection: "Imperial Organza Edition",
    category: "soft-silk", price: 28500, compareAtPrice: 34000, colorName: "Ivory & Warm Gold", colorHex: "#F5F1E8", craftTime: "32 Days on Loom",
    description: "Handcrafted in gossamer-light pure silk organza, adorned with intricate Mughal booti motifs and a scalloped gold zari pallu. Ethereal, delicate, and crafted for day celebrations and receptions.",
    fabric: "Pure Kora Silk Organza", weave: "Handloom Brocade", zari: "Certified Tested Gold Zari", occasion: "Reception & Day Wedding",
    details: [], tags: ["Organza", "Pastel", "Day Wedding"], images: ["/images/looks/look-ivory.jpg"],
  },
  {
    slug: "gulabi-rose-pastels", name: "Gulabi Rose Pastels", subtitle: "Soft Dual-Tone Silver & Blush Silk", collection: "Summer Bloom Collection",
    category: "soft-silk", price: 24800, compareAtPrice: 29500, colorName: "Rose Pink & Silver", colorHex: "#E8B4B8", craftTime: "28 Days on Loom",
    description: "A poetic symphony of blush rose silk interwoven with antique silver zari floral jaal. Designed for the modern woman who cherishes understated poise with ceremonial heritage.",
    fabric: "Soft Mulberry Silk", weave: "Contemporary Jacquard Weave", zari: "Silver & Rose Gold Zari", occasion: "Engagement & Sangeet",
    details: [], tags: ["Rose Gold", "Pastel Bridal"], images: ["/images/looks/look-pink.jpg"],
  },
  {
    slug: "sindhoori-muhurtham-red", name: "Sindhoori Muhurtham Red", subtitle: "The Quintessential Bridal Masterpiece", collection: "Bridal Samudrika Series",
    category: "wedding", price: 48500, compareAtPrice: 56000, colorName: "Sindhoori Crimson", colorHex: "#8B1E2D", craftTime: "45 Days on Loom",
    description: "The crown jewel of Kanchipuram weaving: rich crimson mulberry silk woven with double-warp Korvai technique, adorned with Mayilkan (peacock) motifs and a grand heavy gold zari pallu.",
    fabric: "Heavy 4-Ply Mulberry Silk", weave: "Traditional Korvai Handloom", zari: "Pure Gold Plated Zari", occasion: "Muhurtham & Grand Weddings",
    details: [], tags: ["Bridal Red", "Pure Gold Zari", "Masterpiece"], images: ["/images/looks/look-crimson.png"],
  },
  {
    slug: "mayura-royal-peacock", name: "Mayura Royal Peacock", subtitle: "Deep Sapphire Silk with Korvai Border", collection: "Heritage Classics",
    category: "kanchipuram/traditional", price: 36000, compareAtPrice: 42000, colorName: "Peacock Navy", colorHex: "#0B1B4D", craftTime: "38 Days on Loom",
    description: "An aristocratic shade of deep peacock blue embodying timeless royal elegance. Interwoven with Annapakshi bird motifs and a contrasting antique gold zari temple border.",
    fabric: "Pure Kanchipuram Silk", weave: "Double Warp Korvai", zari: "Tested Antique Gold Zari", occasion: "Grand Receptions & Festivals",
    details: [], tags: ["Royal Blue", "Korvai Border", "Heritage"], images: ["/images/looks/look-blue.png"],
  },
  {
    slug: "maragatham-temple-green", name: "Maragatham Temple Green", subtitle: "Loom-Crafted Architectural Border Pattu", collection: "Sacred Sanctuary Edit",
    category: "kanchipuram/traditional", price: 32500, compareAtPrice: 38000, colorName: "Temple Emerald", colorHex: "#1E5E3A", craftTime: "35 Days on Loom",
    description: "Vibrant jewel-toned emerald green silk reflecting sacred temple corridors of Kancheepuram. Features heavy temple gopuram border patterns and a resplendent floral veil.",
    fabric: "Pure Handloom Silk", weave: "Traditional Kanchi Weave", zari: "Pure Rich Zari", occasion: "Festivals, Pujas & Weddings",
    details: [], tags: ["Emerald Green", "Temple Border", "Festive"], images: ["/images/looks/look-green.jpg"],
  },
];

export const heroBanners = [
  {
    tag: "Royal Muhurtham Edit",
    title: "The Kanchipuram Brocade",
    subtitle: "Woven with double-warp mulberry silk & authentic tested gold zari.",
    image: "/images/hero/hero-main.png",
    accent: "Violet & Gold",
    href: "/wedding",
  },
  {
    tag: "Bridal Crimson Heritage",
    title: "Samudrika Bridal Pattu",
    subtitle: "Auspicious red silk embellished with intricate temple architecture motifs.",
    image: "/images/hero/hero-model.png",
    accent: "Auspicious Crimson",
    href: "/shop/bridal-red-samudrika",
  },
];
