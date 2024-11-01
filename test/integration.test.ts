import { describe, expect, test } from "vitest";
import app from "../src";

describe("Integration tests", () => {
    test("GET /", async () => {
        const res = await app.request("/");
        expect(res.status).toBe(200);
        expect(await res.text()).toBe("Hello Hono!");
    });

    test("GET /health_check", async () => {
        const res = await app.request("/health_check");
        expect(res.status).toBe(200);
        expect(await res.json()).toStrictEqual({ status: "OK" });
    });
});
