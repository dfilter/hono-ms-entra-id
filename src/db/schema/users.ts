import { sql } from "drizzle-orm";
import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  roles: text()
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
});

export type UserInsert = typeof users.$inferInsert;
