type ErrorData = {
    error: string;
    stack?: string;
};

export function parseError(error: unknown): ErrorData {
    let errorData: ErrorData = { error: "Unknown error" };

    if (error instanceof Error) {
        errorData = {
            error: error.message,
            stack: error.stack || "",
        };
    }

    if (typeof error === "string") {
        errorData = { error };
    }

    return errorData;
}
