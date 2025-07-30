import type { Session } from "@/db/schema/sessions";
import type { User } from "@/db/schema/users";

export interface SessionWithUser extends Session {
  user: User;
}
