import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDb } from "../db";
import { subscriptionsTable } from "../db/schema";
import { SubscriberEmail, SubscriptionStatus } from "../subscriptions/domain";
import { EmailService } from "../subscriptions/email-service";
import type { EnvBindings } from "../types";
import { parseError } from "../utils/error-handling";
import type { SimpleLogger } from "../utils/simple-logger";
import type { PublishNewsletterRequest } from "./domain";

export class NewsletterService {
    db: PostgresJsDatabase;
    requestLogger: SimpleLogger;
    emailService: EmailService;

    constructor(env: EnvBindings, requestLogger: SimpleLogger) {
        this.db = getDb(env.DATABASE_URL);
        this.requestLogger = requestLogger;

        const senderEmail = SubscriberEmail.parse(env.EMAIL_SENDER);
        const baseUrl = env.EMAIL_BASE_URL;
        const apiKey = env.EMAIL_API_KEY;
        const apiSecret = env.EMAIL_API_SECRET;
        this.emailService = new EmailService({
            sender: senderEmail,
            baseUrl,
            apiKey,
            apiSecret,
        });
    }

    async publishNewsletter(requestBody: PublishNewsletterRequest) {
        this.requestLogger.info("Publishing newsletter", {
            title: requestBody.title,
            textContent: requestBody.content.text,
            htmlContent: requestBody.content.html,
        });

        this.requestLogger.info("Fetching confirmed subscriber emails");

        const confirmedSubscriberEmails =
            await this.getConfirmedSubscriberEmails();

        this.requestLogger.info(
            `Fetched ${confirmedSubscriberEmails.length} confirmed subscribers`,
        );

        this.requestLogger.info("Sending newsletter to confirmed subscribers");

        for (const { email } of confirmedSubscriberEmails) {
            await this.tryToSendEmailTo(email, requestBody);
        }
    }

    private getConfirmedSubscriberEmails() {
        return this.db
            .select({
                email: subscriptionsTable.email,
            })
            .from(subscriptionsTable)
            .where(eq(subscriptionsTable.status, SubscriptionStatus.Confirmed));
    }

    private async tryToSendEmailTo(
        email: string,
        requestBody: PublishNewsletterRequest,
    ) {
        this.requestLogger.info(`Sending newsletter to "${email}"`);

        try {
            await this.emailService.sendEmail({
                to: SubscriberEmail.parse(email),
                subject: requestBody.title,
                bodyText: requestBody.content.text,
                bodyHtml: requestBody.content.html,
            });
            this.requestLogger.info(`Newsletter sent to "${email}"`);
        } catch (error) {
            const errorData = parseError(error);
            this.requestLogger.error(
                `Failed to send newsletter to "${email}"`,
                errorData,
            );
        }
    }
}
