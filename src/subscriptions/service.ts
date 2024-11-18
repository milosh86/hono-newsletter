import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidV4 } from "uuid";
import { getDb } from "../db";
import { subscriptionTokensTable, subscriptionsTable } from "../db/schema";
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
        const { id } = await this.insertSubscription(subscriptionRequest);

        this.requestLogger.info("Storing subscription token");
        const token = this.generateSubscriptionToken();
        await this.storeSubscriptionToken(id, token);

        this.requestLogger.info("Sending welcome email to subscriber");
        await this.sendWelcomeEmail(
            SubscriberEmail.parse(subscriptionRequest.email),
            token,
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

        return subscription;
    }

    private async sendWelcomeEmail(
        subscriberEmail: SubscriberEmail,
        subscriptionToken: string,
    ) {
        const confirmationLink = `https://there-is-no-such-domain.com/subscriptions/confirm?token=${subscriptionToken}`;

        await this.emailService.sendEmail({
            to: subscriberEmail,
            subject: "Welcome!",
            bodyHtml: `Welcome to our newsletter! Please confirm your subscription by clicking <a href="${confirmationLink}">here</a>.`,
            bodyText: `Welcome to our newsletter! Please confirm your subscription by clicking ${confirmationLink}.`,
        });
    }

    private generateSubscriptionToken() {
        const uuid = uuidV4();
        return uuid.replace(/-/g, "");
    }

    private async storeSubscriptionToken(subscriberId: string, token: string) {
        const subscriptionTokenEntry: typeof subscriptionTokensTable.$inferInsert =
            {
                subscriber_id: subscriberId,
                subscription_token: token,
            };

        await this.db
            .insert(subscriptionTokensTable)
            .values(subscriptionTokenEntry);
    }

    confirmSubscription(subscriberId: string) {
        return this.db
            .update(subscriptionsTable)
            .set({
                status: SubscriptionStatus.Confirmed,
            })
            .where(eq(subscriptionsTable.id, subscriberId));
    }

    async getSubscriberIdFromToken(token: string) {
        const res = await this.db
            .select()
            .from(subscriptionTokensTable)
            .where(eq(subscriptionTokensTable.subscription_token, token));

        if (res.length === 0) {
            return;
        }

        return res[0].subscriber_id;
    }
}
