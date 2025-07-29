import { defineConfig } from "drizzle-kit";

import env from "./src/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    password: env.POSTGRES_PASSWORD,
    user: env.POSTGRES_USER,
    ssl: false,
  },
  casing: "snake_case",
});
