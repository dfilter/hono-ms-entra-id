import { eq } from "drizzle-orm";

import db from "@/db";
import { SessionInsert, sessions } from "@/db/schema/sessions";
import { UserInsert, users } from "@/db/schema/users";
import { tryCatch } from "@/lib/error-handling";

export const deleteSessions = tryCatch(
  async (id: string) =>
    await db.transaction(async (tx) => {
      const session = await tx.query.sessions.findFirst({
        columns: { userId: true },
        where: (fields, operators) => operators.eq(fields.id, id),
      });
      if (!session) return;
      await tx.delete(sessions).where(eq(sessions.userId, session.userId));
    })
);

export const findOrCreateUserInsertSession = tryCatch(
  async (newUser: UserInsert, session: SessionInsert) =>
    await db.transaction(async (tx) => {
      let user = await tx.query.users.findFirst({
        where: (fields, operators) => operators.eq(fields.id, newUser.id),
      });
      if (!user) {
        [user] = await tx.insert(users).values(newUser).returning();
      }
      const [newSession] = await tx
        .insert(sessions)
        .values(session)
        .returning();
      return { ...newSession, user };
    })
);

export const deleteSession = tryCatch(
  async (id: string) => await db.delete(sessions).where(eq(sessions.id, id))
);

export const selectSession = (id: string) =>
  db.query.sessions.findFirst({
    with: { user: true },
    where: (fields, operators) => operators.eq(fields.id, id),
  });
