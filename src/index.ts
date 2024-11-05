import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { simpleLogger } from "./middlewares/simple-logger";
import { SubscriptionsService } from "./subscriptions/service";
import { newSubscriptionRequestSchema } from "./subscriptions/validations";
import type { SimpleLogger } from "./utils/simple-logger";

type Bindings = {
    DATABASE_URL: string;
};

type Variables = { requestLogger: SimpleLogger };

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use(requestId());
app.use(simpleLogger());

app.get("/", (c) => {
    const requestLogger = c.get("requestLogger");
    requestLogger.info("Hello Hono request handling!");
    requestLogger.warn("Hello Hono request warn!");
    requestLogger.error("Hello Hono request error!");
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
        const requestLogger = c.get("requestLogger");

        requestLogger.info("New subscription request", newSubscriptionRequest);

        try {
            const subscriptionService = new SubscriptionsService(
                c.env.DATABASE_URL,
            );
            await subscriptionService.saveSubscription(newSubscriptionRequest);
            return c.text("201 Created", 201);
        } catch (error) {
            // TODO: extract to utility function
            let errorData = {};

            if (error instanceof Error) {
                errorData = {
                    error: error.message,
                    stack: error.stack || "",
                };
            }

            if (typeof error === "string") {
                errorData = { error };
            }

            requestLogger.warn("subscription error", errorData);
            return c.text("500 Internal Error", 500);
        }
    },
);

export default app;
