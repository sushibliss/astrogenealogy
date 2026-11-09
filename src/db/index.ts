import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/**
 * SQLite for local pragmatism. To move to Postgres: switch the imports to
 * `drizzle-orm/node-postgres`, the schema helpers to `pg-core`, and regenerate
 * migrations — queries elsewhere in the app do not change.
 */
function open() {
  const file = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_URL ?? "./data/origen.db");
  mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  // Tables are created/updated automatically on first connection.
  migrate(db, { migrationsFolder: path.resolve(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
  return db;
}

const globalForDb = globalThis as unknown as { __origenDb?: ReturnType<typeof open> };
export const db = globalForDb.__origenDb ?? (globalForDb.__origenDb = open());
export { schema };
