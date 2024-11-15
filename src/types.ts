import type { SimpleLogger } from "./utils/simple-logger";

export type EnvBindings = {
    DATABASE_URL: string;
    EMAIL_BASE_URL: string;
    EMAIL_SENDER: string;
    EMAIL_API_KEY: string;
    EMAIL_API_SECRET: string;
};

export type Variables = { requestLogger: SimpleLogger };
