import { createFactory } from "hono/factory";
import type { Env as EnvVars } from "@/env";
import type { SessionWithUser } from "@/db/types";

type Env = {
  Variables: {
    env: EnvVars;
    session?: SessionWithUser;
  };
};

const factory = createFactory<Env>();

export default factory;
