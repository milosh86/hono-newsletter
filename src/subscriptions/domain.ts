// import type { SubscriptionsEntityDb } from "../db/schema";

import { subscriberEmailSchema, subscriberNameSchema } from "./validations";

export interface NewSubscriptionRequest {
    name: string;
    email: string;
}

export interface SubscriptionEntity {
    id: string;
    name: string;
    email: string;
    // status: SubscriptionStatus;
}

// const allowedStatuses = ["pending_confirmation", "confirmed"] as const;
// export type SubscriptionStatus = (typeof allowedStatuses)[number];

// export function isValidStatus(status: string): status is SubscriptionStatus {
//     return (allowedStatuses as readonly string[]).includes(status);
// }

// export function subscriptionEntityFromDb(
// 	dbEntity: SubscriptionsEntityDb,
// ): SubscriptionEntity {
// 	let status: SubscriptionStatus;
//
// 	if (isValidStatus(dbEntity.status) === false) {
// 		console.error(`Invalid subscription status detected: ${dbEntity.status}`);
// 		status = "pending_confirmation";
// 	} else {
// 		status = dbEntity.status;
// 	}
//
// 	return {
// 		id: dbEntity.id,
// 		name: dbEntity.name,
// 		email: dbEntity.email,
// 		status: status,
// 	};
// }

// export type NewSubscriptionResponse = {
//     kind: "Subscription";
//     self: string;
// } & SubscriptionEntity;
//
// export function formatSubscriptionResponse(
//     subscription: SubscriptionEntity,
// ): NewSubscriptionResponse {
//     return {
//         kind: "Subscription",
//         self: `/subscriptions/${subscription.id}`,
//         id: subscription.id,
//         name: subscription.name,
//         email: subscription.email,
//         status: subscription.status,
//     };
// }

// An example of Type Driven Development, aka parse don't validate
export class SubscriberName {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static parse(input: string): SubscriberName {
        const trimmedInput = input.trim();
        const res = subscriberNameSchema.safeParse(trimmedInput);

        if (!res.success) {
            throw new Error(`'${input}' is not a valid subscriber name.`);
        }

        return new SubscriberName(trimmedInput);
    }

    toString(): string {
        return this.value;
    }
}

export class SubscriberEmail {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    static parse(input: string): SubscriberEmail {
        const trimmedInput = input.trim();
        const res = subscriberEmailSchema.safeParse(trimmedInput);

        if (!res.success) {
            throw new Error(`'${input}' is not a valid subscriber email.`);
        }

        return new SubscriberEmail(trimmedInput);
    }

    toString(): string {
        return this.value;
    }
}
