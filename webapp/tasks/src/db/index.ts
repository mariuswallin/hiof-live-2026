import { drizzle } from "drizzle-orm/d1";
import type { SQLiteAsyncDatabase } from "drizzle-orm/sqlite-core";
import { env } from "cloudflare:workers";
import * as schema from "./schema";
import { relations } from "./relations";

export const db = drizzle(env.DB, { relations });

export { schema, relations };

export type DB = SQLiteAsyncDatabase<any, any, typeof relations>;
