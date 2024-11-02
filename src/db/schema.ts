import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const subscriptionsTable = pgTable("subscriptions", {
    id: uuid().primaryKey(),
    email: text().notNull().unique(),
    name: text().notNull(),
    subscribed_at: timestamp().notNull(),
});

export type SubscriptionsEntityDb = typeof subscriptionsTable.$inferSelect;