import { logger } from "hono/logger";
import { requestId } from "hono/request-id";

import env from "@/env";
import factory from "@/lib/hono";
import envMiddleware from "@/middleware/env";
import sessionMiddleware from "@/middleware/session";
import index from "@/routes/index.route";
import {
  loginCallbackHandler,
  loginHandler,
} from "@/routes/login/login.routes";
import logout from "@/routes/logout/logout.routes";

const app = factory.createApp();

app
  .use(requestId())
  .use(logger())
  .use(envMiddleware(env))
  .use(sessionMiddleware());

app.get("/", ...index);
app.get("/logout", ...logout);
app.get("/login", ...loginHandler);
app.get("/login/callback", ...loginCallbackHandler);

export default app;
