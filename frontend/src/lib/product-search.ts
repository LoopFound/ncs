export interface SearchableProduct {
    name: string;
    price: number;
    category: string;
    description: string;
    details: string[];
    tags: string[];
}

export interface ProductFilters {
    query: string;
    price: string;
    type: string;
    fabric: string;
}

export const NO_FILTERS: ProductFilters = { query: "", price: "", type: "", fabric: "" };

export const PRICE_RANGES = [
    { id: "under-15000", label: "Under ₹15,000", min: 0, max: 15000 },
    { id: "15000-30000", label: "₹15,000 – ₹30,000", min: 15000, max: 30000 },
    { id: "30000-50000", label: "₹30,000 – ₹50,000", min: 30000, max: 50000 },
    { id: "over-50000", label: "₹50,000 and above", min: 50000, max: Infinity },
];

// Material descriptions vary per product, so group them into shopper-friendly fabrics.
const FABRIC_KEYWORDS: [string, string][] = [
    ["mulberry", "Mulberry Silk"],
    ["soft", "Soft Silk"],
    ["handloom", "Handloom Silk"],
    ["kanchipuram", "Kanchipuram Silk"],
    ["shot", "Shot Silk"],
];

const normalize = (value: string) => value.toLowerCase().replace(/-/g, " ").trim();

export function matchesCategory(product: SearchableProduct, category: string) {
    const cat = normalize(category);
    const pCat = normalize(product.category);
    return (
        pCat === cat ||
        pCat.includes(cat) ||
        cat.includes(pCat) ||
        product.tags.some((t) => normalize(t).includes(cat) || cat.includes(normalize(t)))
    );
}

export function fabricOf(product: SearchableProduct) {
    const material = product.details.find((d) => d.startsWith("Material:"))?.toLowerCase() ?? "";
    return FABRIC_KEYWORDS.find(([keyword]) => material.includes(keyword))?.[1] ?? "Pure Silk";
}

export function matchesQuery(product: SearchableProduct, query: string) {
    const haystack = normalize(
        [product.name, product.category, product.description, ...product.details, ...product.tags].join(" ")
    );
    return normalize(query).split(/\s+/).every((word) => haystack.includes(word));
}

export function applyFilters<T extends SearchableProduct>(products: T[], filters: ProductFilters) {
    const range = PRICE_RANGES.find((r) => r.id === filters.price);
    return products.filter(
        (p) =>
            matchesQuery(p, filters.query) &&
            (!range || (p.price >= range.min && p.price < range.max)) &&
            (!filters.type || p.category === filters.type) &&
            (!filters.fabric || fabricOf(p) === filters.fabric)
    );
}

// Name matches rank first so typing a saree's name surfaces it above passing mentions.
export function suggestProducts<T extends SearchableProduct>(products: T[], query: string, limit = 5) {
    if (!normalize(query)) return [];
    const matches = products.filter((p) => matchesQuery(p, query));
    const inName = (p: T) => normalize(p.name).includes(normalize(query));
    return [...matches.filter(inName), ...matches.filter((p) => !inName(p))].slice(0, limit);
}
