import { subscriberEmailSchema, subscriberNameSchema } from "./validations";

export interface NewSubscriptionRequest {
    name: string;
    email: string;
}

export enum SubscriptionStatus {
    PendingConfirmation = "pending_confirmation",
    Confirmed = "confirmed",
}

export interface SubscriptionEntity {
    id: string;
    name: string;
    email: string;
    status: SubscriptionStatus;
}

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
