import type { Context, MiddlewareHandler, Next } from "hono";

import { getPath } from "hono/utils/url";
import { SimpleLogger } from "../utils/simple-logger";

export const simpleLogger = (
    logger = new SimpleLogger(),
): MiddlewareHandler => {
    return async (c: Context, next: Next) => {
        const { method } = c.req;
        const path = getPath(c.req.raw);
        const requestId = c.get("requestId");

        logger.info("Request received", {
            requestId: requestId,
            method,
            path,
        });
        const requestLogger = new SimpleLogger({ requestId });
        c.set("requestLogger", requestLogger);
        const start = Date.now();

        await next();

        const { status } = c.res;

        logger.info("Request processed", {
            requestId: requestId,
            responseStatus: String(status),
            responseOk: String(c.res.ok),
            responseTime: time(start),
        });
    };
};

function time(start: number): string {
    const delta = Date.now() - start;
    return `${delta}ms`;
}
