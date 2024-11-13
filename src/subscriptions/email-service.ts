import type { SubscriberEmail } from "./domain";

export class EmailService {
    sender: SubscriberEmail;
    #credentials: string;

    constructor(sender: SubscriberEmail, apiKey: string, apiSecret: string) {
        this.sender = sender;
        this.#credentials = btoa(`${apiKey}:${apiSecret}`);
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
        });

        const responseBody: any = await response.json();

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
