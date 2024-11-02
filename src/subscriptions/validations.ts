import { z } from "zod";

const forbiddenChars = ["/", "(", ")", '"', "<", ">", "\\", "{", "}"];
const forbiddenCharsRegex = new RegExp(`[${forbiddenChars.join("")}]`);

export const newSubscriptionRequestSchema = z.object({
    name: z
        .string()
        .min(4)
        .max(50)
        .refine((value) => !forbiddenCharsRegex.test(value), {
            message: `Name cannot contain any of the following characters: ${forbiddenChars.join(" ")}`,
        }),
    email: z.string().email().max(100),
});
