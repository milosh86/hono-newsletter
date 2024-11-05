import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { fakerToArb } from "../../test/helpers";
import { SubscriberEmail, SubscriberName } from "./domain";
import { subscriberEmailSchema, subscriberNameSchema } from "./validations";

describe("Validations", () => {
    test("name must be 4+ characters", () => {
        const shortName = "abc";
        const minimalName = "abcde";

        expect(subscriberNameSchema.safeParse(shortName).success).toBe(false);
        expect(subscriberNameSchema.safeParse(minimalName).success).toBe(true);
    });

    test("name must be 50 characters or less", () => {
        const longName = "a".repeat(51);
        const maximalName = "a".repeat(50);

        expect(subscriberNameSchema.safeParse(longName).success).toBe(false);
        expect(subscriberNameSchema.safeParse(maximalName).success).toBe(true);
    });

    test("email must be 50 characters or less", () => {
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

describe("SubscriberEmail", () => {
    test("empty string is rejected", () => {
        const email = "";
        expect(() => SubscriberEmail.parse(email)).toThrow();
    });

    test("email missing @ symbol is rejected", () => {
        const email = "test.com";
        expect(() => SubscriberEmail.parse(email)).toThrow();
    });

    test("email missing subject is rejected", () => {
        const email = "@test.com";
        expect(() => SubscriberEmail.parse(email)).toThrow();
    });

    test("valid emails are parsed successfully", () => {
        fc.assert(
            fc.property(
                fakerToArb((faker) => faker.internet.email()),
                (email) => {
                    return SubscriberEmail.parse(email).toString() === email;
                },
            ),
        );
    });
});

describe("SubscriberName", () => {
    test("valid names are parsed successfully", () => {
        fc.assert(
            fc.property(
                fakerToArb((faker) => faker.person.fullName()),
                (fullName) => {
                    return (
                        SubscriberName.parse(fullName).toString() === fullName
                    );
                },
            ),
        );
    });
});
