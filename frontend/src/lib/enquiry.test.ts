import { describe, expect, it } from "vitest";
import { validateEnquiry } from "./enquiry";

const valid = { name: "Priya", email: "priya@example.com", subject: "Silk & zari?", message: "Is p1 available in blue?" };

describe("validateEnquiry", () => {
    it("accepts a complete enquiry", () => {
        expect(validateEnquiry(valid)).toEqual({});
    });

    it("applies the contactSchema length limits after trimming", () => {
        const errors = validateEnquiry({ name: " P ", email: valid.email, subject: "Hi", message: "Too short" });
        expect(Object.keys(errors).sort()).toEqual(["message", "name", "subject"]);
    });

    it("rejects over-long fields", () => {
        const errors = validateEnquiry({ ...valid, name: "x".repeat(81), subject: "x".repeat(151), message: "x".repeat(4001) });
        expect(errors).toEqual({ name: "Name is too long", subject: "Subject is too long", message: "Message is too long" });
    });

    it("requires a valid email", () => {
        expect(validateEnquiry({ ...valid, email: "priya@" }).email).toBe("Enter a valid email");
    });
});
