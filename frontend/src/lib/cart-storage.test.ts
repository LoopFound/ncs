import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSavedCart, readSavedCart, writeSavedCart } from "./cart-storage";

const validItem = { id: "p1", name: "Silk", price: 45000, image: "/p1.png", quantity: 2, category: "Wedding" };

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("parseSavedCart", () => {
    it("restores a valid saved cart", () => {
        expect(parseSavedCart(JSON.stringify([validItem]))).toEqual([validItem]);
    });

    it.each([
        ["missing", null],
        ["malformed JSON", "{oops"],
        ["null", "null"],
        ["object", "{}"],
        ["null entry", "[null]"],
        ["incomplete entry", '[{"id":"p1"}]'],
        ["negative quantity", JSON.stringify([{ ...validItem, quantity: -1 }])],
        ["fractional quantity", JSON.stringify([{ ...validItem, quantity: 1.5 }])],
        ["zero quantity", JSON.stringify([{ ...validItem, quantity: 0 }])],
        ["negative price", JSON.stringify([{ ...validItem, price: -5 }])],
        ["non-numeric price", JSON.stringify([{ ...validItem, price: "45000" }])],
        ["one bad entry among good", JSON.stringify([validItem, null])],
    ])("returns an empty cart for %s", (_label, raw) => {
        expect(parseSavedCart(raw)).toEqual([]);
    });
});

describe("storage failures", () => {
    it("returns an empty cart when reading is denied", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => {
                throw new Error("denied");
            },
        });
        expect(readSavedCart()).toEqual([]);
    });

    it("does not throw when storage is full", () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.stubGlobal("localStorage", {
            setItem: () => {
                throw new Error("quota");
            },
        });
        expect(() => writeSavedCart([validItem])).not.toThrow();
    });
});
