import db from "@/db";
import { SessionInsert, sessions } from "@/db/schema/sessions";
import { UserInsert, users } from "@/db/schema/users";
import { tryCatch } from "@/lib/error-handling";
import { eq } from "drizzle-orm";

export const upsertUserInsertSession = tryCatch(
  (user: UserInsert, session: SessionInsert) =>
    db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
      const [newSession] = await tx
        .insert(sessions)
        .values(session)
        .returning();
      return { ...newSession, user: newUser };
    })
);

export const deleteSession = tryCatch((id: string) =>
  db.delete(sessions).where(eq(sessions.id, id))
);

export const selectSession = (id: string) =>
  db.query.sessions.findFirst({
    with: { user: true },
    where: (fields, operators) => operators.eq(fields.id, id),
  });
