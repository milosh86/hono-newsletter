import { execSync } from "node:child_process";
import { Faker, type Randomizer, base, en, es, fr, ru } from "@faker-js/faker";
import fc from "fast-check";
import postgres from "postgres";

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
    const testDbName = "integration_test_db";

    const sql = postgres(dbConfig);

    try {
        // db or column names can't be parameterized! That's why unsafe is used.
        // Drop the test database if it exists
        await sql.unsafe(`DROP DATABASE IF EXISTS ${testDbName} WITH (FORCE);`);
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
