import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { newSubscriptionRequestSchema } from "./subscriptions/validations";

const app = new Hono();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

// todo: split routes into separate files - check hono docs for edge cases

app.get("/health_check", (c) => {
    return c.json({ status: "OK" });
});

app.post(
    "/subscriptions",
    zValidator("json", newSubscriptionRequestSchema),
    async (c) => {
        return c.text("Not implemented", 201);
    },
);
export default app;
