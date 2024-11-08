import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 as uuidV4 } from "uuid";
import { getDb } from "../db";
import { subscriptionsTable } from "../db/schema";
import { type NewSubscriptionRequest, SubscriptionStatus } from "./domain";

export class SubscriptionsService {
    db: PostgresJsDatabase<Record<string, never>>;

    constructor(private dbUrl: string) {
        this.db = getDb(dbUrl);
    }

    async saveSubscription(subscriptionRequest: NewSubscriptionRequest) {
        const subscription: typeof subscriptionsTable.$inferInsert = {
            id: uuidV4(),
            name: subscriptionRequest.name,
            email: subscriptionRequest.email,
            subscribed_at: new Date(),
            status: SubscriptionStatus.Confirmed,
        };

        await this.db.insert(subscriptionsTable).values(subscription);
    }
}
