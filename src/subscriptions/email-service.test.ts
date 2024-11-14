import nock from "nock";
import { describe, expect, test } from "vitest";
import { SubscriberEmail } from "./domain";
import { EmailService } from "./email-service";

describe("Email Service", () => {
    test("send success", async () => {
        const emailService = new EmailService(
            SubscriberEmail.parse("test@test.com"),
            "api-key",
            "api-secret",
        );
        nock("https://api.mailjet.com/v3.1")
            .post("/send", {
                Messages: [
                    {
                        From: {
                            Email: "test@test.com",
                            Name: "Hono Test App",
                        },
                        To: [{ Email: "user@test.com" }],
                        Subject: "Test subject",
                        HTMLPart: "<h1>Test body</h1>",
                        TextPart: "Test body",
                    },
                ],
            })
            // .post("/send", (body) => {
            //     console.log("askdakjs", body.Messages[0].To);
            //     return true;
            // })
            .reply(200, {
                Messages: [
                    {
                        Status: "success",
                    },
                ],
            });

        await expect(
            emailService.sendEmail({
                to: SubscriberEmail.parse("user@test.com"),
                subject: "Test subject",
                bodyHtml: "<h1>Test body</h1>",
                bodyText: "Test body",
            }),
        ).resolves.toBeUndefined();
    });

    test("send failure - invalid request param", async () => {
        const emailService = new EmailService(
            SubscriberEmail.parse("test@test.com"),
            "api-key",
            "api-secret",
        );

        nock("https://api.mailjet.com/v3.1")
            .post("/send")
            // emulate a request param error, i.e. auth error
            .reply(200, {
                ErrorMessage: "Failed to send email",
            });

        await expect(
            emailService.sendEmail({
                to: SubscriberEmail.parse("user@test.com"),
                subject: "Test subject",
                bodyHtml: "<h1>Test body</h1>",
                bodyText: "Test body",
            }),
        ).rejects.toThrow("Failed to send email");
    });

    test("send failure - invalid message param", async () => {
        const emailService = new EmailService(
            SubscriberEmail.parse("test@test.com"),
            "api-key",
            "api-secret",
        );

        nock("https://api.mailjet.com/v3.1")
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

        await expect(
            emailService.sendEmail({
                to: SubscriberEmail.parse("user@test.com"),
                subject: "Test subject",
                bodyHtml: "<h1>Test body</h1>",
                bodyText: "Test body",
            }),
        ).rejects.toThrow("Failed to send email 1");
    });
});
