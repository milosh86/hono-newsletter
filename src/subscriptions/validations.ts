import { z } from "zod";

const forbiddenChars = ["/", "(", ")", '"', "<", ">", "\\", "{", "}"];
const forbiddenCharsRegex = new RegExp(`[${forbiddenChars.join("")}]`);

export const subscriberNameSchema = z
    .string()
    .min(4)
    .max(50)
    .refine((value) => !forbiddenCharsRegex.test(value), {
        message: `Name cannot contain any of the following characters: ${forbiddenChars.join(" ")}`,
    });

export const subscriberEmailSchema = z.string().email().max(50);

export const newSubscriptionRequestSchema = z.object({
    name: subscriberNameSchema,
    email: subscriberEmailSchema,
});
