import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test } from "vitest";
import app from "../src";
import { configureDb, setupEmailServiceSuccessMock } from "./helpers";

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

describe("Subscription Confirmation", () => {
    test("POST /subscriptions/confirm returns 400 a request without token", async () => {
        const res = await app.request("/subscriptions/confirm", {}, MOCK_ENV);
        expect(res.status).toBe(400);
    });

    test("POST /subscriptions/confirm returns 200 when called with link created by subscribe API", async () => {
        // arrange
        const email = faker.internet.email();
        const name = faker.person.fullName();
        const validBody = JSON.stringify({ name, email });
        let receivedBody: any;
        const scope = setupEmailServiceSuccessMock(
            MOCK_ENV.EMAIL_BASE_URL,
            (body) => {
                receivedBody = body;
            },
        );

        await app.request(
            "/subscriptions",
            {
                method: "POST",
                body: validBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            MOCK_ENV,
        );

        // act
        await app.request("/subscriptions/confirm", {}, MOCK_ENV);

        // todo: extract url parsing to helper
        const urlRegex =
            /https:\/\/there-is-no-such-domain\.com\/subscriptions\/confirm\?token=([a-zA-Z0-9]+)/;
        const emailBody = receivedBody.Messages[0].TextPart;
        const match = emailBody.match(urlRegex);

        expect(
            match,
            `No confirmation link found in email body: ${emailBody}`,
        ).not.toBeNull();

        const token = match[1];

        const res = await app.request(
            `/subscriptions/confirm?token=${token}`,
            {},
            MOCK_ENV,
        );

        // assert
        expect(res.status).toBe(200);
    });
});
