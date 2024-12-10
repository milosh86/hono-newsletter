import { z } from "zod";

export const newsletterRequestSchema = z.object({
    title: z.string().min(4).max(250),
    content: z.object({
        html: z.string().min(4),
        text: z.string().min(4),
    }),
});
