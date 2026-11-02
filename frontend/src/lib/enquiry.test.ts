import { describe, expect, it } from "vitest";
import { buildEnquiryMailto, ENQUIRY_EMAIL } from "./enquiry";

describe("buildEnquiryMailto", () => {
    it("carries every field and encodes special characters", () => {
        const url = new URL(
            buildEnquiryMailto({
                name: " Priya ",
                email: "priya@example.com",
                subject: "Silk & zari?",
                message: "Is p1 available?",
            })
        );

        expect(url.pathname).toBe(ENQUIRY_EMAIL);
        expect(url.searchParams.get("subject")).toBe("Silk & zari?");
        expect(url.searchParams.get("body")).toBe("Is p1 available?\n\nFrom: Priya <priya@example.com>");
    });
});
