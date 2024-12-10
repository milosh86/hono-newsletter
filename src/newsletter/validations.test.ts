import { describe, expect, test } from "vitest";
import app from "../index";

describe("Newsletter Validations", () => {
    test("POST /newsletters returns 400 for invalid request data", async () => {
        // arrange
        const testCases: [Record<string, string | object>, string][] = [
            [{ title: "Test Title" }, "missing content"],
            [
                { content: { text: "Test Text", html: "<p>Test Html</p>" } },
                "missing title",
            ],
            [{}, "missing both title and content"],
            [
                {
                    title: "",
                    content: { text: "Test Text", html: "<p>Test Html</p>" },
                },
                "empty title",
            ],
            [
                {
                    title: "Test Title",
                    content: { text: "", html: "<p>Test Html</p>" },
                },
                "empty text",
            ],
            [
                { title: "Test Title", content: { text: "Test Text" } },
                "missing html",
            ],
            [
                {
                    title: "Test Title",
                    content: { text: "Test Text", html: "" },
                },
                "empty html",
            ],
        ];

        // act
        for (const [body, description] of testCases) {
            const res = await app.request("/newsletters", {
                method: "POST",
                body: JSON.stringify(body),
                headers: new Headers({
                    "Content-Type": "application/json",
                }),
            });

            // assert
            expect(res.status, description).toBe(400);
        }
    });
});
