import { describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR, apiRequest, authRequest, onUnauthorized } from "./api";

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("apiRequest", () => {
    it("returns data from an ok ActionResult and sends same-origin JSON", async () => {
        const fetcher = vi.fn(async () => jsonResponse({ ok: true, data: { user: null } }));
        const result = await apiRequest("/api/storefront/session", { fetcher });

        expect(result).toEqual({ ok: true, data: { user: null } });
        expect(fetcher).toHaveBeenCalledWith("/api/storefront/session", expect.objectContaining({ method: "GET", credentials: "same-origin" }));
    });

    it("posts a JSON body", async () => {
        const fetcher = vi.fn<typeof fetch>(async () => jsonResponse({ ok: true }));
        await apiRequest("/api/storefront/newsletter", { method: "POST", body: { email: "a@b.in" }, fetcher });

        const init = fetcher.mock.calls[0][1];
        expect(init?.body).toBe('{"email":"a@b.in"}');
        expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    });

    it("passes through the server error, field errors and status", async () => {
        const fetcher = vi.fn(async () =>
            jsonResponse({ ok: false, error: "Please check the highlighted fields.", fields: { "address.pincode": "Enter a valid 6-digit PIN code" } }, 400),
        );
        expect(await apiRequest("/api/storefront/checkout/place", { method: "POST", body: {}, fetcher })).toEqual({
            ok: false,
            error: "Please check the highlighted fields.",
            fields: { "address.pincode": "Enter a valid 6-digit PIN code" },
            status: 400,
        });
    });

    it("maps a network failure to a friendly error", async () => {
        const fetcher = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });
        expect(await apiRequest("/api/storefront/orders", { fetcher })).toEqual({ ok: false, error: NETWORK_ERROR });
    });

    it.each([
        [401, "Please sign in to continue."],
        [429, "Too many attempts. Please wait a minute and try again."],
        [502, "Something went wrong on our side. Please try again."],
    ])("falls back to a status message for a non-JSON %i", async (status, message) => {
        const fetcher = vi.fn(async () => new Response("<html>Bad gateway</html>", { status }));
        expect(await apiRequest("/api/storefront/orders", { fetcher })).toEqual({ ok: false, error: message, status });
    });

    it("tells unauthorized listeners about a 401, and stops after unsubscribing", async () => {
        const listener = vi.fn();
        const unsubscribe = onUnauthorized(listener);
        const fetcher = vi.fn(async () => jsonResponse({ ok: false, error: "Please sign in to continue." }, 401));

        const result = await apiRequest("/api/storefront/orders", { fetcher });
        expect(result).toMatchObject({ ok: false, status: 401 });
        expect(listener).toHaveBeenCalledTimes(1);

        await apiRequest("/api/storefront/orders", { fetcher: vi.fn(async () => jsonResponse({ ok: false, error: "Bad" }, 400)) });
        expect(listener).toHaveBeenCalledTimes(1);

        unsubscribe();
        await apiRequest("/api/storefront/orders", { fetcher });
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("never treats a 2xx without the ActionResult shape as success", async () => {
        const fetcher = vi.fn(async () => jsonResponse({ hello: "world" }));
        const result = await apiRequest("/api/storefront/contact", { fetcher });
        expect(result.ok).toBe(false);
    });
});

describe("authRequest", () => {
    it("returns Better Auth's JSON on success", async () => {
        const fetcher = vi.fn(async () => jsonResponse({ user: { id: "u1" }, token: "t" }));
        expect(await authRequest("/api/auth/sign-in/email", { email: "a@b.in", password: "x" }, fetcher)).toEqual({
            ok: true,
            data: { user: { id: "u1" }, token: "t" },
        });
    });

    it("reads message and code from a Better Auth error", async () => {
        const fetcher = vi.fn(async () => jsonResponse({ code: "EMAIL_NOT_VERIFIED", message: "Email not verified" }, 403));
        expect(await authRequest("/api/auth/sign-in/email", {}, fetcher)).toEqual({
            ok: false,
            error: "Email not verified",
            code: "EMAIL_NOT_VERIFIED",
            status: 403,
        });
    });

    it("maps a network failure to a friendly error", async () => {
        const fetcher = vi.fn(async () => {
            throw new TypeError("Failed to fetch");
        });
        expect(await authRequest("/api/auth/sign-out", {}, fetcher)).toEqual({ ok: false, error: NETWORK_ERROR });
    });
});
