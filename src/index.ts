import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { simpleLogger } from "./middlewares/simple-logger";
import { NewsletterService } from "./newsletter/newsletter-service";
import { newsletterRequestSchema } from "./newsletter/validations";
import { SubscriptionsService } from "./subscriptions/subscriptions-service";
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
    zValidator("json", newSubscriptionRequestSchema), // throws 400 if validation fails!
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

        try {
            const subscriptionService = new SubscriptionsService(
                c.env,
                requestLogger,
            );

            const subscriberId =
                await subscriptionService.getSubscriberIdFromToken(token);

            if (!subscriberId) {
                return c.text("401 Unauthorized", 401);
            }

            await subscriptionService.confirmSubscription(subscriberId);
        } catch (error) {
            const errorData = parseError(error);

            requestLogger.warn("subscription confirmation error", errorData);
            return c.text("500 Internal Error", 500);
        }

        return c.text("200 OK", 200);
    },
);

app.post(
    "/newsletters",
    zValidator("json", newsletterRequestSchema), // throws 400 if validation fails!
    async (c) => {
        const requestLogger = c.get("requestLogger");
        requestLogger.info("New newsletter request");
        const newsletterService = new NewsletterService(c.env, requestLogger);
        const newsletterRequest = c.req.valid("json");

        try {
            await newsletterService.publishNewsletter(newsletterRequest);
        } catch (error) {
            const errorData = parseError(error);
            requestLogger.error("newsletter error", errorData);
            return c.text("500 Internal Error", 500);
        }

        return c.text("200 OK", 200);
    },
);

export default app;
