import { describe, expect, it } from "vitest";
import { products } from "@/data/mock";
import {
    INDIAN_STATES,
    buildPlaceOrderInput,
    cartToSyncPayload,
    formatINR,
    mapCheckoutFieldErrors,
    toIndianE164,
    validateCheckoutForm,
    type CheckoutForm,
} from "./checkout";

describe("cartToSyncPayload", () => {
    it("maps storefront ids to backend slugs", () => {
        const payload = cartToSyncPayload([
            { id: "p1", quantity: 2 },
            { id: "p14", quantity: 1 },
        ]);
        expect(payload).toEqual({
            items: [
                { slug: "royal-kanchipuram-silk", quantity: 2 },
                { slug: "kanchipuram-silk-dupatta", quantity: 1 },
            ],
            unknownIds: [],
            cappedIds: [],
        });
    });

    it("has a slug for every catalogue product", () => {
        const payload = cartToSyncPayload(products.map((p) => ({ id: p.id, quantity: 1 })));
        expect(payload.unknownIds).toEqual([]);
        expect(payload.items.map((i) => i.slug)).toEqual(products.map((p) => p.slug));
    });

    it("reports ids that are not in the catalogue instead of sending them", () => {
        const payload = cartToSyncPayload([{ id: "p1", quantity: 1 }, { id: "gone", quantity: 3 }]);
        expect(payload.items).toEqual([{ slug: "royal-kanchipuram-silk", quantity: 1 }]);
        expect(payload.unknownIds).toEqual(["gone"]);
    });

    it("merges duplicates and caps quantity at the server limit of 10", () => {
        const payload = cartToSyncPayload([{ id: "p2", quantity: 7 }, { id: "p2", quantity: 6 }]);
        expect(payload.items).toEqual([{ slug: "classic-gold-border-pattu", quantity: 10 }]);
        expect(payload.cappedIds).toEqual(["p2"]);
    });

    it("returns no items for an empty cart", () => {
        expect(cartToSyncPayload([]).items).toEqual([]);
    });
});

describe("toIndianE164", () => {
    it.each([
        ["98765 43210", "+919876543210"],
        ["+91 98765-43210", "+919876543210"],
        ["09876543210", "+919876543210"],
        ["919876543210", "+919876543210"],
    ])("normalises %s", (raw, expected) => {
        expect(toIndianE164(raw)).toBe(expected);
    });

    it.each(["12345 67890", "98765", "+1 415 555 0100", ""])("rejects %s", (raw) => {
        expect(toIndianE164(raw)).toBeNull();
    });
});

const form: CheckoutForm = {
    fullName: "Radhika Ramanathan",
    phone: "98765 43210",
    email: "radhika@example.com",
    address: "12, North Mada Street",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600004",
    addFallPico: true,
    giftWrap: false,
    giftMessage: "ignored without gift wrap",
    paymentMethod: "upi",
};

describe("checkout form mapping", () => {
    it("builds a checkoutSchema payload", () => {
        expect(buildPlaceOrderInput(form, " diwali10 ")).toEqual({
            address: {
                fullName: "Radhika Ramanathan",
                phone: "+919876543210",
                line1: "12, North Mada Street",
                city: "Chennai",
                state: "Tamil Nadu",
                pincode: "600004",
            },
            email: "radhika@example.com",
            paymentMethod: "RAZORPAY",
            couponCode: "diwali10",
            addFallPico: true,
            giftWrap: false,
            giftMessage: undefined,
            saveAddress: true,
        });
        expect(buildPlaceOrderInput({ ...form, paymentMethod: "cod" }, "").paymentMethod).toBe("COD");
        expect(buildPlaceOrderInput({ ...form, paymentMethod: "card" }, "").couponCode).toBeUndefined();
    });

    it("validates like the server", () => {
        expect(validateCheckoutForm(form)).toEqual({});
        expect(validateCheckoutForm({ ...form, state: "Madras", pincode: "060004", phone: "12345" })).toEqual({
            state: "Choose a state",
            pincode: "Enter a valid 6-digit PIN code",
            phone: "Enter a valid 10-digit Indian mobile number",
        });
    });

    it("uses the backend state names", () => {
        expect(INDIAN_STATES).toHaveLength(36);
        expect(INDIAN_STATES).toContain("Dadra and Nagar Haveli and Daman and Diu");
    });

    it("maps server field paths onto form fields", () => {
        expect(mapCheckoutFieldErrors({ "address.pincode": "Bad PIN", "address.line1": "Too short", address: "Choose an address", couponCode: "Expired" })).toEqual({
            byField: { pincode: "Bad PIN", address: "Too short" },
            other: ["Choose an address", "Expired"],
        });
    });
});

describe("formatINR", () => {
    it("formats paise as rupees", () => {
        expect(formatINR(4_500_000)).toBe("₹45,000");
        expect(formatINR(12_345)).toBe("₹123.45");
    });
});
