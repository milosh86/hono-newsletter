import { faker } from "@faker-js/faker";
import nock from "nock";
import { beforeEach, describe, expect, test } from "vitest";
import app from "../src";
import { configureDb, setupEmailServiceSuccessMock } from "./helpers";

const MOCK_ENV = {
    APP_BASE_URL: "https://test-app.com",
    DATABASE_URL: "example.com",
    EMAIL_BASE_URL: "https://test-email-service.com",
    EMAIL_SENDER: "test-sender@test.com",
    EMAIL_API_KEY: "test-api-key",
    EMAIL_API_SECRET: "test-api-secret",
};

async function createUnconfirmedSubscriber() {
    setupEmailServiceSuccessMock(MOCK_ENV.EMAIL_BASE_URL);

    const validBody = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
    };

    await app.request(
        "/subscriptions",
        {
            method: "POST",
            body: JSON.stringify(validBody),
            headers: new Headers({ "Content-Type": "application/json" }),
        },
        MOCK_ENV,
    );
}

beforeEach(async () => {
    const { testDbUrl } = await configureDb();
    MOCK_ENV.DATABASE_URL = testDbUrl;

    return async () => {
        // cleanup code
    };
});

describe("Newsletter", () => {
    test("newsletters are not delivered to unconfirmed subscribers", async () => {
        // arrange
        await createUnconfirmedSubscriber();

        nock(MOCK_ENV.EMAIL_BASE_URL)
            .post("/send")
            // no request should be fired to the email service
            .times(0)
            .reply(200, {
                Messages: [
                    {
                        Status: "success",
                    },
                ],
            });

        // act
        const newsletterRequestBody = JSON.stringify({
            title: "Newsletter title",
            content: {
                text: "Newsletter body as plain text",
                html: "<p>Newsletter body as HTML</p>",
            },
        });
        const res = await app.request(
            "/newsletters",
            {
                method: "POST",
                body: newsletterRequestBody,
                headers: new Headers({ "Content-Type": "application/json" }),
            },
            MOCK_ENV,
        );

        // assert
        expect(res.status).toBe(200);
    });
});
