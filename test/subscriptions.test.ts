import { describe, expect, test } from "vitest";
import app from "../src";

describe("Subscriptions", () => {
    test("POST /subscriptions returns 201 for valid request data", async () => {
        const validBody = JSON.stringify({
            name: "Test Name",
            email: "test.email@test.com",
        });

        const res = await app.request(
            "/subscriptions",
            {
                method: "POST",
                body: validBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            // MOCK_ENV,
        );
        expect(res.status).toBe(201);
    });

    test("POST /subscriptions returns 400 for invalid request data", async () => {
        const invalidBodiesPairs: [Record<string, string>, string][] = [
            [{ name: "Test Name" }, "missing email"],
            [{ email: "test@test.com" }, "missing name"],
            [{ something: "else" }, "missing both name and email"],
            [{ name: "", email: "test@test.com" }, "empty name"],
            // [
            //     { name: "hello<>there{}", email: "test@test.com" },
            //     "invalid name",
            // ],
            [{ name: "Test Name", email: "" }, "empty email"],
            // [
            //     { name: "Test Name", email: "definitely-not-an-email" },
            //     "invalid email",
            // ],
        ];

        for (const [body, description] of invalidBodiesPairs) {
            const res = await app.request(
                "/subscriptions",
                {
                    method: "POST",
                    body: JSON.stringify(body),
                    headers: new Headers({
                        "Content-Type": "application/json",
                    }),
                },
                // MOCK_ENV,
            );
            expect(res.status, description).toBe(400);
        }
    });
});
