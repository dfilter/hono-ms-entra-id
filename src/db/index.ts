import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import env from "@/env";
import { sessionRelations, sessions } from "@/db/schema/sessions";
import { users } from "@/db/schema/users";

/**
 * Cache the database connection in development.
 * This avoids creating a new connection on every HMR update.
 */
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};
const pool =
  globalForDb.pool ??
  new Pool({
    password: env.POSTGRES_PASSWORD,
    user: env.POSTGRES_USER,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    host: env.POSTGRES_HOST,
  });
if (env.NODE_ENV !== "production") globalForDb.pool = pool;

const db = drizzle(pool, {
  casing: "snake_case",
  schema: {
    sessions,
    sessionRelations,
    users,
  },
});

export default db;
