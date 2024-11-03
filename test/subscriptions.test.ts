import postgres from "postgres";
import { beforeEach, describe, expect, test } from "vitest";
import app from "../src";
import { configureDb } from "./helpers";

const MOCK_ENV = {
    DATABASE_URL: "example.com",
};

beforeEach(async () => {
    const { testDbUrl } = await configureDb();
    MOCK_ENV.DATABASE_URL = testDbUrl;

    return async () => {
        // cleanup code
    };
});

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
            MOCK_ENV,
        );
        expect(res.status).toBe(201);
    });

    test("POST /subscriptions persists new subscriber", async () => {
        // arrange
        const sql = postgres(MOCK_ENV.DATABASE_URL);
        const validBody = JSON.stringify({
            name: "Test Name",
            email: "test@test.com",
        });

        // act
        const res = await app.request(
            "/subscriptions",
            {
                method: "POST",
                body: validBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            MOCK_ENV,
        );

        // assert
        const subscriptions = await sql`SELECT * FROM subscriptions`;

        expect(subscriptions.length).toBe(1);
        expect(subscriptions[0].name).toBe("Test Name");
        expect(subscriptions[0].email).toBe("test@test.com");
    });

    test("POST /subscriptions returns 400 for invalid request data", async () => {
        const invalidBodiesPairs: [Record<string, string>, string][] = [
            [{ name: "Test Name" }, "missing email"],
            [{ email: "test@test.com" }, "missing name"],
            [{ something: "else" }, "missing both name and email"],
            [{ name: "", email: "test@test.com" }, "empty name"],
            [
                { name: "hello<>there{}", email: "test@test.com" },
                "invalid name",
            ],
            [{ name: "Test Name", email: "" }, "empty email"],
            [
                { name: "Test Name", email: "definitely-not-an-email" },
                "invalid email",
            ],
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
                MOCK_ENV,
            );
            expect(res.status, description).toBe(400);
        }
    });
});
