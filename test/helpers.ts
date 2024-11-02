import { execSync } from "node:child_process";
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
