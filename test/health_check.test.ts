import { describe, expect, test } from "vitest";
import { app } from "../src";

describe("Health Check", () => {
    test("GET /health_check", async () => {
        const res = await app.request("/health_check");
        expect(res.status).toBe(200);
        expect(await res.json()).toStrictEqual({ status: "OK" });
    });
});
