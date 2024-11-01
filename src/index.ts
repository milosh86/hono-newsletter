import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

app.get("/health_check", (c) => {
    return c.json({ status: "OK" });
});

export default app;
