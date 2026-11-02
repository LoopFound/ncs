import type { CartItem } from "@/context/CartContext";

const CART_STORAGE_KEY = "ncs_cart";

function isCartItem(value: unknown): value is CartItem {
    if (typeof value !== "object" || value === null) return false;
    const item = value as Record<string, unknown>;

    return (
        typeof item.id === "string" && item.id.length > 0 &&
        typeof item.name === "string" && item.name.length > 0 &&
        typeof item.image === "string" &&
        typeof item.category === "string" &&
        typeof item.price === "number" && Number.isFinite(item.price) && item.price >= 0 &&
        Number.isSafeInteger(item.quantity) && (item.quantity as number) > 0
    );
}

// Any invalid saved data resets to an empty cart. Prices here are for display only.
export function parseSavedCart(raw: string | null): CartItem[] {
    if (!raw) return [];

    try {
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.every(isCartItem) ? parsed : [];
    } catch {
        return [];
    }
}

export function readSavedCart(): CartItem[] {
    try {
        return parseSavedCart(localStorage.getItem(CART_STORAGE_KEY));
    } catch {
        return [];
    }
}

// Storage can be blocked or full; the in-memory cart keeps working either way.
export function writeSavedCart(items: CartItem[]) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
        console.error("Failed to save cart to localStorage", e);
    }
}
