import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { simpleLogger } from "./middlewares/simple-logger";
import { SubscriberEmail } from "./subscriptions/domain";
import { EmailService } from "./subscriptions/email-service";
import { SubscriptionsService } from "./subscriptions/service";
import {
    confirmSubscriptionParamsSchema,
    newSubscriptionRequestSchema,
} from "./subscriptions/validations";
import type { EnvBindings, Variables } from "./types";
import { parseError } from "./utils/error-handling";

const app = new Hono<{ Bindings: EnvBindings; Variables: Variables }>();

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
                c.env,
                requestLogger,
            );

            await subscriptionService.saveSubscription(newSubscriptionRequest);

            return c.text("201 Created", 201);
        } catch (error) {
            const errorData = parseError(error);

            requestLogger.warn("subscription error", errorData);
            return c.text("500 Internal Error", 500);
        }
    },
);

app.get(
    "/subscriptions/confirm",
    zValidator("query", confirmSubscriptionParamsSchema),
    async (c) => {
        const { token } = c.req.valid("query");
        const requestLogger = c.get("requestLogger");
        requestLogger.info("Confirming subscription", { token });

        return c.text("200 OK", 200);
    },
);

export default app;
