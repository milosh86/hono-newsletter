import { drizzle } from "drizzle-orm/postgres-js";

export function getDb(dbString: string) {
	return drizzle(dbString);
}
