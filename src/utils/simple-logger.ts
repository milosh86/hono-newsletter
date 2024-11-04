type LogLevel = "INFO" | "WARN" | "ERROR";
type Metadata = Record<string, string>;

export class SimpleLogger {
    defaultMeta: Metadata;

    constructor(defaultMeta: Metadata = {}) {
        this.defaultMeta = defaultMeta;
    }

    log(level: LogLevel, message: string, meta?: Metadata) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...this.defaultMeta,
            ...meta,
        };
        console.log(JSON.stringify(logEntry));
    }

    info(message: string, meta?: Metadata) {
        this.log("INFO", message, meta);
    }

    warn(message: string, meta?: Metadata) {
        this.log("WARN", message, meta);
    }

    error(message: string, meta?: Metadata) {
        this.log("ERROR", message, meta);
    }
}
