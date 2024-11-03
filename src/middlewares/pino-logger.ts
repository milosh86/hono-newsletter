import type { Context, MiddlewareHandler, Next } from "hono";
import type { Logger } from "pino";

import { getPath } from "hono/utils/url";
import pino from "pino";

export const pinoLogger = (
    logger: Logger = pino({ level: "info" }),
): MiddlewareHandler => {
    return async (c: Context, next: Next) => {
        const { method } = c.req;
        const path = getPath(c.req.raw);
        const requestId = c.get("requestId");

        logger.info({
            requestId: requestId,
            request: {
                method,
                path,
            },
        });
        const requestLogger = logger.child({ requestId });
        c.set("requestLogger", requestLogger);
        const start = Date.now();

        await next();

        const { status } = c.res;

        logger.info({
            requestId: requestId,
            response: {
                status,
                ok: String(c.res.ok),
                time: time(start),
            },
        });
    };
};

function time(start: number): string {
    const delta = Date.now() - start;
    return `${delta}ms`;
}
