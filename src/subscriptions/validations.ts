import { z } from "zod";

export const newSubscriptionRequestSchema = z.object({
	name: z.string().min(4).max(50),
	email: z.string().email().max(100),
});
