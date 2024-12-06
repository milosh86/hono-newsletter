import { execSync } from "node:child_process";
import {
    Faker,
    type Randomizer,
    base,
    en,
    es,
    faker,
    fr,
    ru,
} from "@faker-js/faker";
import fc from "fast-check";
import nock from "nock";
import postgres from "postgres";
import { v4 as uuidV4 } from "uuid";
import type app from "../src";
import type { EnvBindings } from "../src/types";

type HonoApp = typeof app;

interface DbConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

export async function configureDb() {
    const dbConfig: DbConfig = {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "password",
        database: "postgres", // Connect to the default database to create a new one
    };
    const testDbName = `integration_test_db_${uuidV4().replace(/-/g, "_")}`;

    const sql = postgres(dbConfig);

    try {
        // db or column names can't be parameterized! That's why unsafe is used.
        // Create a new test database
        await sql.unsafe(`CREATE DATABASE ${testDbName};`);
    } finally {
        await sql.end();
    }

    const testDbUrl = `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${testDbName}`;

    // Run migrations on the new test database
    execSync(`DATABASE_URL=${testDbUrl} npx drizzle-kit migrate`);

    return { testDbUrl };
}

// Property based testing
class FakerBuilder<TValue> extends fc.Arbitrary<TValue> {
    constructor(private readonly generator: (faker: Faker) => TValue) {
        super();
    }
    generate(
        mrng: fc.Random,
        biasFactor: number | undefined,
    ): fc.Value<TValue> {
        const randomizer: Randomizer = {
            next: (): number => mrng.nextDouble(),
            seed: () => {}, // no-op, no support for updates of the seed, could even throw
        };
        const customFaker = new Faker({
            locale: [base, en, es, fr, ru],
            randomizer,
        });
        return new fc.Value(this.generator(customFaker), undefined);
    }
    canShrinkWithoutContext(value: unknown): value is TValue {
        return false;
    }
    shrink(value: TValue, context: unknown): fc.Stream<fc.Value<TValue>> {
        return fc.Stream.nil();
    }
}

export function fakerToArb<TValue>(
    generator: (faker: Faker) => TValue,
): fc.Arbitrary<TValue> {
    return new FakerBuilder(generator);
}

export function setupEmailServiceSuccessMock(
    baseUrl: string,
    onBodyReceived?: (body: unknown) => void,
) {
    return nock(baseUrl)
        .post("/send", (body) => {
            onBodyReceived?.(body);
            return true;
        })
        .once()
        .reply(200, {
            Messages: [
                {
                    Status: "success",
                },
            ],
        });
}

export function extractTokenFromEmail(emailBody: string) {
    const urlRegex =
        /https?:\/\/[^\s]+?\?[^\s]*?token=([a-f0-9]{32})(?:&[^\s]*)?/;
    const match = emailBody.match(urlRegex);

    if (!match) {
        throw new Error(
            `No confirmation link found in email body: ${emailBody}`,
        );
    }
    // expect(
    //     match,
    //     `No confirmation link found in email body: ${emailBody}`,
    // ).not.toBeNull();

    return match[1];
}

type EmailRequest = {
    Messages: {
        From: {
            Email: string;
            Name: string;
        };
        To: {
            Email: string;
        }[];
        Subject: string;
        HTMLPart: string;
        TextPart: string;
    }[];
};

function isEmailRequest(body: unknown): body is EmailRequest {
    return !!body && Array.isArray((body as EmailRequest).Messages);
}

export async function createUnconfirmedSubscription({
    app,
    mockEnv,
}: { app: HonoApp; mockEnv: EnvBindings }) {
    let receivedBody: EmailRequest | undefined;
    setupEmailServiceSuccessMock(mockEnv.EMAIL_BASE_URL, (body) => {
        receivedBody = isEmailRequest(body) ? body : undefined;
    });

    const validBody = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
    };

    await app.request(
        "/subscriptions",
        {
            method: "POST",
            body: JSON.stringify(validBody),
            headers: new Headers({ "Content-Type": "application/json" }),
        },
        mockEnv,
    );

    const emailBody = receivedBody ? receivedBody.Messages[0].TextPart : "";
    const token = extractTokenFromEmail(emailBody);

    return { requestData: validBody, confirmationToken: token };
}

export function confirmSubscription({
    app,
    token,
    mockEnv,
}: { app: HonoApp; token: string; mockEnv: EnvBindings }) {
    return app.request(`/subscriptions/confirm?token=${token}`, {}, mockEnv);
}

export async function createConfirmedSubscription({
    app,
    mockEnv,
}: { app: HonoApp; mockEnv: EnvBindings }) {
    const { confirmationToken } = await createUnconfirmedSubscription({
        app,
        mockEnv,
    });

    await confirmSubscription({ app, token: confirmationToken, mockEnv });
}
