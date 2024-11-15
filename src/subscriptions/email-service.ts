import type { SubscriberEmail } from "./domain";

export class EmailService {
    sender: SubscriberEmail;
    readonly #baseUrl: string;
    readonly #credentials: string;
    readonly #timeout: number;

    constructor({
        sender,
        baseUrl,
        apiKey,
        apiSecret,
        timeout = 10_000,
    }: {
        sender: SubscriberEmail;
        baseUrl: string;
        apiKey: string;
        apiSecret: string;
        timeout?: number;
    }) {
        this.sender = sender;
        this.#credentials = btoa(`${apiKey}:${apiSecret}`);
        this.#timeout = timeout;
        this.#baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
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

        const response = await fetch(`${this.#baseUrl}/send`, {
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
