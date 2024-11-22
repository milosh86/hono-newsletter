import { describe, expect, test } from "vitest";
import { trimTrailingSlash } from "./text";

describe("Text utils", () => {
    test("trimTrailingSlash removes / at the end", () => {
        expect(trimTrailingSlash("https://example.com/")).toBe(
            "https://example.com",
        );
    });

    test("trimTrailingSlash does nothing if there in no / at the end", () => {
        expect(trimTrailingSlash("https://example.com")).toBe(
            "https://example.com",
        );
    });
});
