export interface DrapeLook {
    id: string;
    name: string;
    subtitle: string;
    collection: string;
    price: number;
    originalPrice: number;
    rating: number;
    reviewCount: number;
    colorName: string;
    colorHex: string;
    accentColor: string;
    image: string;
    thumbnail: string;
    description: string;
    fabric: string;
    weave: string;
    zari: string;
    occasion: string;
    modelStats: string;
    craftTime: string;
    tags: string[];
}

export const drapeLooks: DrapeLook[] = [
    {
        id: "look-ivory",
        name: "Ivory Organza Bloom",
        subtitle: "Woven with 24K Pure Gold Zari Bootis",
        collection: "Imperial Organza Edition",
        price: 28500,
        originalPrice: 34000,
        rating: 4.9,
        reviewCount: 128,
        colorName: "Ivory & Warm Gold",
        colorHex: "#F5F1E8",
        accentColor: "#C9A227",
        image: "/images/looks/look-ivory.jpg",
        thumbnail: "/images/looks/look-ivory.jpg",
        description: "Handcrafted in gossamer-light pure silk organza, adorned with intricate Mughal booti motifs and a scalloped gold zari pallu. Ethereal, delicate, and crafted for day celebrations and receptions.",
        fabric: "Pure Kora Silk Organza",
        weave: "Handloom Brocade",
        zari: "Certified Tested Gold Zari",
        occasion: "Reception & Day Wedding",
        modelStats: "Model is 5'9\" wearing standard 5.5m drape with tailored blouse",
        craftTime: "32 Days on Loom",
        tags: ["Organza", "Pastel", "Day Wedding", "Bestseller"]
    },
    {
        id: "look-pink",
        name: "Gulabi Rose Pastels",
        subtitle: "Soft Dual-Tone Silver & Blush Silk",
        collection: "Summer Bloom Collection",
        price: 24800,
        originalPrice: 29500,
        rating: 4.8,
        reviewCount: 94,
        colorName: "Rose Pink & Silver",
        colorHex: "#E8B4B8",
        accentColor: "#B86B77",
        image: "/images/looks/look-pink.jpg",
        thumbnail: "/images/looks/look-pink.jpg",
        description: "A poetic symphony of blush rose silk interwoven with antique silver zari floral jaal. Designed for the modern woman who cherishes understated poise with ceremonial heritage.",
        fabric: "Soft Mulberry Silk",
        weave: "Contemporary Jacquard Weave",
        zari: "Silver & Rose Gold Zari",
        occasion: "Engagement & Sangeet",
        modelStats: "Model is 5'8\" wearing standard 5.5m drape with elbow sleeve blouse",
        craftTime: "28 Days on Loom",
        tags: ["Soft Silk", "Rose Gold", "Pastel Bridal"]
    },
    {
        id: "look-crimson",
        name: "Sindhoori Muhurtham Red",
        subtitle: "The Quintessential Bridal Masterpiece",
        collection: "Bridal Samudrika Series",
        price: 48500,
        originalPrice: 56000,
        rating: 5.0,
        reviewCount: 215,
        colorName: "Sindhoori Crimson",
        colorHex: "#8B1E2D",
        accentColor: "#E8B931",
        image: "/images/looks/look-crimson.png",
        thumbnail: "/images/looks/look-crimson.png",
        description: "The crown jewel of Kanchipuram weaving: rich crimson mulberry silk woven with double-warp Korvai technique, adorned with Mayilkan (peacock) motifs and a grand heavy gold zari pallu.",
        fabric: "Heavy 4-Ply Mulberry Silk",
        weave: "Traditional Korvai Handloom",
        zari: "Pure Gold Plated Zari",
        occasion: "Muhurtham & Grand Weddings",
        modelStats: "Model is 5'9\" wearing traditional South Indian bridal drape",
        craftTime: "45 Days on Loom",
        tags: ["Bridal Red", "Kanchipuram Pattu", "Pure Gold Zari", "Masterpiece"]
    },
    {
        id: "look-blue",
        name: "Mayura Royal Peacock",
        subtitle: "Deep Sapphire Silk with Korvai Border",
        collection: "Heritage Classics",
        price: 36000,
        originalPrice: 42000,
        rating: 4.9,
        reviewCount: 167,
        colorName: "Peacock Navy",
        colorHex: "#0B1B4D",
        accentColor: "#C9A227",
        image: "/images/looks/look-blue.png",
        thumbnail: "/images/looks/look-blue.png",
        description: "An aristocratic shade of deep peacock blue embodying timeless royal elegance. Interwoven with Annapakshi bird motifs and a contrasting antique gold zari temple border.",
        fabric: "Pure Kanchipuram Silk",
        weave: "Double Warp Korvai",
        zari: "Tested Antique Gold Zari",
        occasion: "Grand Receptions & Festivals",
        modelStats: "Model is 5'9\" wearing classic pleated drape",
        craftTime: "38 Days on Loom",
        tags: ["Royal Blue", "Korvai Border", "Heritage"]
    },
    {
        id: "look-green",
        name: "Maragatham Temple Green",
        subtitle: "Loom-Crafted Architectural Border Pattu",
        collection: "Sacred Sanctuary Edit",
        price: 32500,
        originalPrice: 38000,
        rating: 4.8,
        reviewCount: 112,
        colorName: "Temple Emerald",
        colorHex: "#1E5E3A",
        accentColor: "#C9A227",
        image: "/images/looks/look-green.jpg",
        thumbnail: "/images/looks/look-green.jpg",
        description: "Vibrant jewel-toned emerald green silk reflecting sacred temple corridors of Kancheepuram. Features heavy temple gopuram border patterns and a resplendent floral veil.",
        fabric: "Pure Handloom Silk",
        weave: "Traditional Kanchi Weave",
        zari: "Pure Rich Zari",
        occasion: "Festivals, Pujas & Weddings",
        modelStats: "Model is 5'8\" wearing festive pleated pallu",
        craftTime: "35 Days on Loom",
        tags: ["Emerald Green", "Temple Border", "Festive"]
    }
];
