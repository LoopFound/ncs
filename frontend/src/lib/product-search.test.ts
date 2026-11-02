import { describe, expect, it } from "vitest";
import { products } from "../data/mock";
import { applyFilters, fabricOf, matchesCategory, NO_FILTERS, suggestProducts } from "./product-search";

const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe("applyFilters", () => {
    it("returns everything when no filter is set", () => {
        expect(applyFilters(products, NO_FILTERS)).toHaveLength(products.length);
    });

    it("searches product text, requiring every word", () => {
        expect(ids(applyFilters(products, { ...NO_FILTERS, query: "samudrika" }))).toEqual(["p6"]);
        expect(ids(applyFilters(products, { ...NO_FILTERS, query: "dhoti silk" }))).toEqual(["p15"]);
        expect(applyFilters(products, { ...NO_FILTERS, query: "polyester" })).toEqual([]);
    });

    it("applies price ranges", () => {
        const under = applyFilters(products, { ...NO_FILTERS, price: "under-15000" });
        expect(under.length).toBeGreaterThan(0);
        expect(under.every((p) => p.price < 15000)).toBe(true);
        expect(ids(applyFilters(products, { ...NO_FILTERS, price: "over-50000" }))).toEqual(["p4", "p6", "p10"]);
    });

    it("combines type and fabric filters", () => {
        const result = applyFilters(products, { ...NO_FILTERS, type: "Wedding", fabric: "Mulberry Silk" });
        expect(ids(result)).toEqual(["p1", "p6"]);
    });
});

describe("fabricOf", () => {
    it("groups varied material descriptions", () => {
        expect(fabricOf(products[0])).toBe("Mulberry Silk");
        expect(fabricOf(products[1])).toBe("Pure Silk");
    });
});

describe("matchesCategory", () => {
    it("matches hyphenated collection slugs", () => {
        expect(ids(products.filter((p) => matchesCategory(p, "soft-silk")))).toContain("p3");
    });
});

describe("suggestProducts", () => {
    it("ranks name matches first and honours the limit", () => {
        expect(suggestProducts(products, "bridal")[0].id).toBe("p6");
        expect(suggestProducts(products, "silk", 3)).toHaveLength(3);
        expect(suggestProducts(products, "  ")).toEqual([]);
    });
});
