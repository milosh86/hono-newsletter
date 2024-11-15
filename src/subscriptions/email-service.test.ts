import { faker } from "@faker-js/faker";
import nock from "nock";
import { describe, expect, test } from "vitest";
import { SubscriberEmail } from "./domain";
import { EmailService } from "./email-service";

describe("Email Service", () => {
    const EMAIL_SERVICE_API = "https://test-email-service.com";
    const testParams = {
        to: SubscriberEmail.parse("user@test.com"),
        subject: "Test subject",
        bodyHtml: "<h1>Test body</h1>",
        bodyText: "Test body",
    };

    function createEmailService(timeout?: number) {
        return new EmailService({
            sender: SubscriberEmail.parse("test@test.com"),
            baseUrl: EMAIL_SERVICE_API,
            apiKey: "api-key",
            apiSecret: "api-secret",
            timeout: timeout,
        });
    }

    test("send success", async () => {
        // arrange
        const senderEmail = SubscriberEmail.parse(faker.internet.email());
        const receiverEmail = SubscriberEmail.parse(faker.internet.email());
        const emailService = new EmailService({
            sender: senderEmail,
            baseUrl: EMAIL_SERVICE_API,
            apiKey: "api-key",
            apiSecret: "api-secret",
        });
        const subject = faker.lorem.sentence();
        const content = faker.lorem.paragraphs({ min: 1, max: 10 });

        // act & assert
        nock(EMAIL_SERVICE_API)
            .post("/send", {
                // this part is like assertion for the request
                Messages: [
                    {
                        From: {
                            Email: senderEmail.toString(),
                            Name: "Hono Test App",
                        },
                        To: [{ Email: receiverEmail.toString() }],
                        Subject: subject,
                        HTMLPart: content,
                        TextPart: content,
                    },
                ],
            })
            // TODO: how to see what exactly has not been matched?
            .basicAuth({ user: "api-key", pass: "api-secret" })
            .matchHeader("Content-Type", "application/json")
            // .post("/send", (body) => {
            //     console.log("askdakjs", body.Messages[0].To);
            //     return true;
            // })
            .once() // this is default, but just to be explicit. Equivalent to ".expect(1)" in Rust example
            .reply(200, {
                Messages: [
                    {
                        Status: "success",
                    },
                ],
            });

        await expect(
            emailService.sendEmail({
                to: receiverEmail,
                subject: subject,
                bodyHtml: content,
                bodyText: content,
            }),
        ).resolves.toBeUndefined();
    });

    test("send failure - invalid request param", async () => {
        const emailService = createEmailService();

        nock(EMAIL_SERVICE_API)
            .post("/send")
            // emulate a request param error, i.e. auth error
            .reply(200, {
                ErrorMessage: "Failed to send email",
            });

        await expect(emailService.sendEmail(testParams)).rejects.toThrow(
            "Failed to send email",
        );
    });

    test("send failure - invalid message param", async () => {
        const emailService = createEmailService();

        nock(EMAIL_SERVICE_API)
            .post("/send")
            // emulate a message param error
            .reply(200, {
                Messages: [
                    {
                        Status: "failed",
                        ErrorMessage: "Failed to send email 1",
                    },
                ],
            });

        await expect(emailService.sendEmail(testParams)).rejects.toThrow(
            "Failed to send email 1",
        );
    });

    test("send failure - server 400 and 500", async () => {
        const emailService = createEmailService();

        nock(EMAIL_SERVICE_API)
            // emulate server errors
            .post("/send")
            .reply(500, "Internal Error")
            .post("/send")
            .reply(400, "Bad Request");

        await expect(emailService.sendEmail(testParams)).rejects.toThrow(
            "Internal Error",
        );
        await expect(emailService.sendEmail(testParams)).rejects.toThrow(
            "Bad Request",
        );
    });

    test("send failure - network delay (timeout)", async () => {
        const emailService = createEmailService(100);

        nock(EMAIL_SERVICE_API)
            // emulate slow server, still replying with success
            .post("/send")
            .delay(10 * 1000)
            .reply(200, {
                Messages: [
                    {
                        Status: "success",
                    },
                ],
            });

        await expect(emailService.sendEmail(testParams)).rejects.toThrow(
            "This operation was aborted",
        );
    });
});
