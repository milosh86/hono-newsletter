import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { simpleLogger } from "./middlewares/simple-logger";
import { SubscriberEmail } from "./subscriptions/domain";
import { EmailService } from "./subscriptions/email-service";
import { SubscriptionsService } from "./subscriptions/service";
import { newSubscriptionRequestSchema } from "./subscriptions/validations";
import { parseError } from "./utils/error-handling";
import type { SimpleLogger } from "./utils/simple-logger";

type Bindings = {
    DATABASE_URL: string;
    EMAIL_BASE_URL: string;
    EMAIL_SENDER: string;
    EMAIL_API_KEY: string;
    EMAIL_API_SECRET: string;
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
            const senderEmail = SubscriberEmail.parse(c.env.EMAIL_SENDER);
            const baseUrl = c.env.EMAIL_BASE_URL;
            const apiKey = c.env.EMAIL_API_KEY;
            const apiSecret = c.env.EMAIL_API_SECRET;
            const emailService = new EmailService({
                sender: senderEmail,
                baseUrl,
                apiKey,
                apiSecret,
            });
            const subscriptionService = new SubscriptionsService(
                c.env.DATABASE_URL,
            );

            requestLogger.info("Inserting new subscriber into DB");
            await subscriptionService.saveSubscription(newSubscriptionRequest);

            requestLogger.info("Sending welcome email to subscriber");
            const confirmationLink =
                "https://there-is-no-such-domain.com/subscriptions/confirm";
            await emailService.sendEmail({
                to: SubscriberEmail.parse(newSubscriptionRequest.email),
                subject: "Welcome!",
                bodyHtml: `Welcome to our newsletter! Please confirm your subscription by clicking <a href="${confirmationLink}">here</a>.`,
                bodyText: `Welcome to our newsletter! Please confirm your subscription by clicking ${confirmationLink}.`,
            });

            return c.text("201 Created", 201);
        } catch (error) {
            const errorData = parseError(error);

            requestLogger.warn("subscription error", errorData);
            return c.text("500 Internal Error", 500);
        }
    },
);

app.get("/email", async (c) => {
    const requestLogger = c.get("requestLogger");

    requestLogger.info("New email request");

    try {
        const senderEmail = SubscriberEmail.parse(c.env.EMAIL_SENDER);
        const baseUrl = c.env.EMAIL_BASE_URL;
        const apiKey = c.env.EMAIL_API_KEY;
        const apiSecret = c.env.EMAIL_API_SECRET;
        requestLogger.info("sender", {
            senderEmail: senderEmail.toString(),
            apiKey,
        });
        const emailService = new EmailService({
            sender: senderEmail,
            baseUrl,
            apiKey,
            apiSecret,
        });

        await emailService.sendEmail({
            to: SubscriberEmail.parse("bfvqrytxe@mozmail.com"),
            subject: "Hello from Hono",
            bodyHtml: "<h1>Hello Hono!</h1>",
            bodyText: "Hello Hono!",
        });
        return c.text("200 OK", 200);
    } catch (error) {
        const errorData = parseError(error);

        requestLogger.warn("email error", errorData);
        return c.text("500 Internal Error", 500);
    }
});

export default app;
