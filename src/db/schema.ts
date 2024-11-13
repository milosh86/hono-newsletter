import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable("subscriptions", {
    id: uuid().primaryKey(),
    email: text().notNull().unique(),
    name: text().notNull(),
    status: text().notNull(),
    subscribed_at: timestamp().notNull(),
});

export type SubscriptionsEntityDb = typeof subscriptionsTable.$inferSelect;

export const subscriptionTokensTable = pgTable("subscription_tokens", {
    subscription_token: text().primaryKey(),
    subscriber_id: uuid()
        .notNull()
        .references(() => subscriptionsTable.id),
});

export type SubscriptionTokensEntityDb =
    typeof subscriptionTokensTable.$inferSelect;
