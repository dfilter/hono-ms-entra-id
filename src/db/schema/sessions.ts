import { users } from "@/db/schema/users";
import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenType: text().notNull(),
  accessToken: text().notNull(),
  scopes: text()
    .array()
    .default(sql`ARRAY[]::text[]`)
    .notNull(),
  expiresOn: timestamp(),
});

export type SessionInsert = typeof sessions.$inferInsert;
export type Session = typeof sessions.$inferSelect;

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
    relationName: "user_sessions",
  }),
}));
