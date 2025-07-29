import db from "@/db";
import { UserInsert, users } from "@/db/schema/users";

export async function upsertUser(user: UserInsert) {
  await db.insert(users).values(user).onConflictDoNothing();
}
