import type { SubscriberEmail } from "./domain";

export class EmailService {
    sender: SubscriberEmail;
    readonly #credentials: string;
    readonly #timeout: number;

    constructor(
        sender: SubscriberEmail,
        apiKey: string,
        apiSecret: string,
        timeout = 10_000,
    ) {
        this.sender = sender;
        this.#credentials = btoa(`${apiKey}:${apiSecret}`);
        this.#timeout = timeout;
    }

    async sendEmail({
        to,
        subject,
        bodyHtml,
        bodyText,
    }: {
        to: SubscriberEmail;
        subject: string;
        bodyHtml: string;
        bodyText: string;
    }) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.#timeout);

        const response = await fetch("https://api.mailjet.com/v3.1/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${this.#credentials}`,
            },
            body: JSON.stringify({
                Messages: [
                    {
                        From: {
                            Email: this.sender.toString(),
                            Name: "Hono Test App",
                        },
                        To: [{ Email: to.toString() }],
                        Subject: subject,
                        HTMLPart: bodyHtml,
                        TextPart: bodyText,
                    },
                ],
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody: SendEmailResponse = await response.json();

        if (responseBody?.ErrorMessage) {
            throw new Error(JSON.stringify(responseBody));
        }

        if (Array.isArray(responseBody?.Messages)) {
            for (const message of responseBody.Messages) {
                if (message.Status !== "success") {
                    throw new Error(JSON.stringify(message));
                }
            }
        }
    }
}

type SendEmailResponse = {
    ErrorMessage?: string;
    Messages?: {
        Status: string;
    }[];
};
