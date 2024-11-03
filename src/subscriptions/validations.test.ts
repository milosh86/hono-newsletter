import { describe, expect, test } from "vitest";
import { subscriberEmailSchema, subscriberNameSchema } from "./validations";

describe("Validations", () => {
    test("name must be 4+ characters", async () => {
        const shortName = "abc";
        const minimalName = "abcde";

        expect(subscriberNameSchema.safeParse(shortName).success).toBe(false);
        expect(subscriberNameSchema.safeParse(minimalName).success).toBe(true);
    });

    test("name must be 50 characters or less", async () => {
        const longName = "a".repeat(51);
        const maximalName = "a".repeat(50);

        expect(subscriberNameSchema.safeParse(longName).success).toBe(false);
        expect(subscriberNameSchema.safeParse(maximalName).success).toBe(true);
    });

    test("email must be 50 characters or less", async () => {
        const longEmail = "abcde".repeat(9) + "@ab.co";
        const maximalEmail = "abcde".repeat(8) + "@abcdef.co";

        expect(longEmail.length).toBeGreaterThan(50);
        expect(maximalEmail.length).toBe(50);

        expect(subscriberEmailSchema.safeParse(longEmail).success).toBe(false);
        expect(subscriberEmailSchema.safeParse(maximalEmail).success).toBe(
            true,
        );
    });
});
