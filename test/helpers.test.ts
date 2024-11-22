import { describe, expect, test } from "vitest";
import { extractTokenFromEmail } from "./helpers";

describe("Utils", () => {
    test("extractTokenFromEmail returns token from email body", () => {
        const validTestCases = [
            "Hello, this is some text in the email body: https://test-app.com/confirm?token=abcdef1234567890abcdef1234567890 Bye bye",
            "Click here: http://app.com/verify?param1=value&token=abcdef1234567890abcdef1234567890&other=value",
        ];

        for (const testCase of validTestCases) {
            expect(extractTokenFromEmail(testCase)).toBe(
                "abcdef1234567890abcdef1234567890",
            );
        }
    });

    test("extractTokenFromEmail returns null if there is not valid link with token", () => {
        const invalidTestCases = [
            "Direct token=86631515484e480d9762182fe664a801 without URL",
            "Invalid token=12345 should not match",
            "No token present in this text",
        ];

        for (const testCase of invalidTestCases) {
            expect(() => extractTokenFromEmail(testCase)).toThrow();
        }
    });
});
