import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { SubscriptionsService } from "./subscriptions/service";
import { newSubscriptionRequestSchema } from "./subscriptions/validations";

type Bindings = {
    DATABASE_URL: string;
};

type Variables = Record<string, never>;

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

// todo: split routes into separate files - check hono best practice docs for edge cases

app.get("/health_check", (c) => {
    return c.json({ status: "OK" });
});

app.post(
    "/subscriptions",
    zValidator("json", newSubscriptionRequestSchema),
    async (c) => {
        const newSubscriptionRequest = c.req.valid("json");

        try {
            console.log("c.env.DATABASE_URL", c, newSubscriptionRequest);
            const subscriptionService = new SubscriptionsService(
                c.env.DATABASE_URL,
            );
            await subscriptionService.saveSubscription(newSubscriptionRequest);
            return c.text("201 Created", 201);
        } catch (error) {
            console.info("subscription error:", error);
            return c.text("500 Internal Error", 500);
        }
    },
);
