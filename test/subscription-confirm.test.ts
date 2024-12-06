import postgres from "postgres";
import { beforeEach, describe, expect, test } from "vitest";
import app from "../src";
import { configureDb, createUnconfirmedSubscription } from "./helpers";

const MOCK_ENV = {
    APP_BASE_URL: "https://test-app.com",
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

describe("Subscription Confirmation", () => {
    test("GET /subscriptions/confirm returns 400 a request without token", async () => {
        const res = await app.request("/subscriptions/confirm", {}, MOCK_ENV);
        expect(res.status).toBe(400);
    });

    test("GET /subscriptions/confirm returns 200 when called with link created by subscribe API", async () => {
        // arrange
        const { confirmationToken } = await createUnconfirmedSubscription({
            app,
            mockEnv: MOCK_ENV,
        });

        // act
        const res = await app.request(
            `/subscriptions/confirm?token=${confirmationToken}`,
            {},
            MOCK_ENV,
        );

        // assert
        expect(res.status).toBe(200);
    });

    test("GET /subscriptions/confirm returns 401 for unknown subscription token", async () => {
        // arrange
        const { confirmationToken } = await createUnconfirmedSubscription({
            app,
            mockEnv: MOCK_ENV,
        });

        // act
        const res = await app.request(
            "/subscriptions/confirm?token=unknown-token-1234567890",
            {},
            MOCK_ENV,
        );

        // assert
        expect(res.status).toBe(401);
    });

    test("Clicking on the confirmation link confirms a subscriber", async () => {
        // arrange
        const sql = postgres(MOCK_ENV.DATABASE_URL);
        const { confirmationToken, requestData } =
            await createUnconfirmedSubscription({
                app,
                mockEnv: MOCK_ENV,
            });

        // act
        const res = await app.request(
            `/subscriptions/confirm?token=${confirmationToken}`,
            {},
            MOCK_ENV,
        );

        // assert
        const subscriptions = await sql`SELECT * FROM subscriptions`;

        expect(subscriptions.length).toBe(1);
        expect(subscriptions[0].status).toBe("confirmed");
        expect(subscriptions[0].name).toBe(requestData.name);
        expect(subscriptions[0].email).toBe(requestData.email);
    });
});
