// import { eq } from "drizzle-orm";
// import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
// import { v4 as uuidV4 } from "uuid";
// import { getDb } from "../db";
// import { subscriptionsTable } from "../db/schema";
// import type {
// 	NewSubscriptionRequest,
// 	SubscriptionEntity,
// 	SubscriptionStatus,
// } from "./domain";
// import { subscriptionEntityFromDb } from "./domain";
//
// export class SubscriptionService {
// 	db: PostgresJsDatabase<Record<string, never>>;
//
// 	constructor(private dbUrl: string) {
// 		this.db = getDb(dbUrl);
// 	}
//
// 	async saveSubscription(subscriptionRequest: NewSubscriptionRequest) {
// 		const status: SubscriptionStatus = "pending_confirmation";
// 		const subscription: typeof subscriptionsTable.$inferInsert = {
// 			id: uuidV4(),
// 			name: subscriptionRequest.name,
// 			email: subscriptionRequest.email,
// 			subscribed_at: new Date(),
// 			status: status,
// 		};
//
// 		await this.db.insert(subscriptionsTable).values(subscription);
// 		return subscriptionEntityFromDb(subscription);
// 	}
//
// 	async getSubscription(
// 		subscriptionId: string,
// 	): Promise<SubscriptionEntity | undefined> {
// 		const res = await this.db
// 			.select()
// 			.from(subscriptionsTable)
// 			.where(eq(subscriptionsTable.id, subscriptionId));
//
// 		const subscription = res[0];
// 		return subscription ? subscriptionEntityFromDb(subscription) : undefined;
// 	}
//
// 	// TODO implement paging
// 	async getSubscriptions() {
// 		const subscriptions = await this.db.select().from(subscriptionsTable);
// 		return subscriptions.map(subscriptionEntityFromDb);
// 	}
// }
