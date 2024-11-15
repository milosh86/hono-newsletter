import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidV4 } from "uuid";
import { getDb } from "../db";
import { subscriptionsTable } from "../db/schema";
import type { EnvBindings } from "../types";
import type { SimpleLogger } from "../utils/simple-logger";
import {
    type NewSubscriptionRequest,
    SubscriberEmail,
    SubscriptionStatus,
} from "./domain";
import { EmailService } from "./email-service";

export class SubscriptionsService {
    db: PostgresJsDatabase<Record<string, never>>;
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

    async saveSubscription(subscriptionRequest: NewSubscriptionRequest) {
        this.requestLogger.info("Inserting new subscriber into DB");
        await this.insertSubscription(subscriptionRequest);

        this.requestLogger.info("Sending welcome email to subscriber");
        await this.sendWelcomeEmail(
            SubscriberEmail.parse(subscriptionRequest.email),
        );
    }

    private async insertSubscription(
        subscriptionRequest: NewSubscriptionRequest,
    ) {
        const subscription: typeof subscriptionsTable.$inferInsert = {
            id: uuidV4(),
            name: subscriptionRequest.name,
            email: subscriptionRequest.email,
            subscribed_at: new Date(),
            status: SubscriptionStatus.PendingConfirmation,
        };

        await this.db.insert(subscriptionsTable).values(subscription);
    }

    private async sendWelcomeEmail(subscriberEmail: SubscriberEmail) {
        const confirmationLink =
            "https://there-is-no-such-domain.com/subscriptions/confirm";

        await this.emailService.sendEmail({
            to: subscriberEmail,
            subject: "Welcome!",
            bodyHtml: `Welcome to our newsletter! Please confirm your subscription by clicking <a href="${confirmationLink}">here</a>.`,
            bodyText: `Welcome to our newsletter! Please confirm your subscription by clicking ${confirmationLink}.`,
        });
    }
}
