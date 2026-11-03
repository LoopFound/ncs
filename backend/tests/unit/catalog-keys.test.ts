import { describe, expect, it } from "vitest";
import { listCacheKey, normalizeListInput } from "@/server/services/catalog";

describe("normalizeListInput", () => {
  it("trims, lowercases and collapses free text", () => {
    expect(normalizeListInput({ q: "  Silk   SAREE " }).q).toBe("silk saree");
    expect(normalizeListInput({ q: "   " }).q).toBeUndefined();
  });
  it("clamps paging", () => {
    const n = normalizeListInput({ page: -4, pageSize: 5000 });
    expect(n.page).toBe(1);
    expect(n.pageSize).toBe(60);
    expect(normalizeListInput({ page: 99999 }).page).toBe(200);
  });
});

describe("listCacheKey", () => {
  it("is independent of key order and casing noise", () => {
    const a = listCacheKey("p", normalizeListInput({ q: "Silk", fabric: "Kanchi", page: 2 }));
    const b = listCacheKey("p", normalizeListInput({ page: 2, fabric: " kanchi ", q: "silk " }));
    expect(a).toBe(b);
  });
  it("differs when filters differ", () => {
    expect(listCacheKey("p", normalizeListInput({ sort: "price-asc" }))).not.toBe(
      listCacheKey("p", normalizeListInput({ sort: "price-desc" })),
    );
  });
});
