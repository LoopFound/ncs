import { describe, expect, it } from "vitest";
import { safeNext, verifiedLoginPath } from "./safe-next";

describe("verifiedLoginPath", () => {
    it("carries a safe next path through verification", () => {
        const path = verifiedLoginPath("/checkout");
        expect(path).toBe("/login?verified=1&next=%2Fcheckout");
        expect(new URLSearchParams(path.split("?")[1]).get("next")).toBe("/checkout");
    });

    it("replaces an unsafe next with the account page", () => {
        expect(verifiedLoginPath("https://evil.example")).toBe("/login?verified=1&next=%2Faccount");
        expect(verifiedLoginPath(null)).toBe("/login?verified=1&next=%2Faccount");
    });
});

describe("safeNext", () => {
    it.each(["/checkout", "/account", "/shop/product/p1?ref=bag", "/order-success?order=NCS-1"])("keeps the same-site path %s", (path) => {
        expect(safeNext(path)).toBe(path);
    });

    it.each([
        ["missing", null],
        ["empty", ""],
        ["absolute URL", "https://evil.example/phish"],
        ["protocol-relative", "//evil.example"],
        ["backslash host", "/\\evil.example"],
        ["tab-smuggled host", "/\t/evil.example"],
        ["newline", "/account\n"],
        ["javascript URL", "javascript:alert(1)"],
        ["relative without slash", "account"],
        ["login loop", "/login?next=/checkout"],
        ["bare login", "/login"],
        ["API route", "/api/auth/sign-out"],
    ])("falls back for %s", (_label, value) => {
        expect(safeNext(value)).toBe("/account");
    });

    it("uses the given fallback", () => {
        expect(safeNext("//evil.example", "/")).toBe("/");
    });

    it("caps very long paths", () => {
        expect(safeNext(`/${"a".repeat(1000)}`)).toHaveLength(512);
    });
});
