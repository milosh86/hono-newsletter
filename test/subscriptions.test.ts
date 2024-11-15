import { faker } from "@faker-js/faker";
import nock from "nock";
import postgres from "postgres";
import { beforeEach, describe, expect, test } from "vitest";
import app from "../src";
import { SubscriptionStatus } from "../src/subscriptions/domain";
import {
    configureDb,
    parseLinks,
    setupEmailServiceSuccessMock,
} from "./helpers";

const MOCK_ENV = {
    DATABASE_URL: "example.com",
    EMAIL_BASE_URL: "https://test-email-service.com",
    EMAIL_SENDER: "test-sender@test.com",
    EMAIL_API_KEY: "test-api-key",
    EMAIL_API_SECRET: "test-api-secret",
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
        const _scope = setupEmailServiceSuccessMock(MOCK_ENV.EMAIL_BASE_URL);

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
        setupEmailServiceSuccessMock(MOCK_ENV.EMAIL_BASE_URL);
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
        expect(subscriptions[0].status).toBe(
            SubscriptionStatus.PendingConfirmation,
        );
        expect(res.status).toBe(201);
    });

    test("POST /subscriptions sends a confirmation email to new subscriber", async () => {
        // arrange
        const validBody = JSON.stringify({
            name: faker.person.fullName(),
            email: faker.internet.email(),
        });

        const scope = setupEmailServiceSuccessMock(MOCK_ENV.EMAIL_BASE_URL);

        // act
        await app.request(
            "/subscriptions",
            {
                method: "POST",
                body: validBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            MOCK_ENV,
        );

        // assert
        expect(scope.isDone()).toBe(true);
    });

    test("POST /subscriptions sends a confirmation email with links", async () => {
        // arrange
        const validBody = JSON.stringify({
            name: faker.person.fullName(),
            email: faker.internet.email(),
        });

        const scope = nock(MOCK_ENV.EMAIL_BASE_URL)
            .post("/send", (body) => {
                // assert part for body content
                const message = body.Messages[0];

                return (
                    message.HTMLPart.includes(
                        "https://there-is-no-such-domain.com/subscriptions/confirm",
                    ) &&
                    message.TextPart.includes(
                        "https://there-is-no-such-domain.com/subscriptions/confirm",
                    )
                );
            })
            .once()
            .reply(200, {
                Messages: [
                    {
                        Status: "success",
                    },
                ],
            });

        // act
        await app.request(
            "/subscriptions",
            {
                method: "POST",
                body: validBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            MOCK_ENV,
        );

        // assert
        expect(scope.isDone()).toBe(true);
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
