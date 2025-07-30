import type { Env } from "@/env";
import factory from "@/lib/hono";

const envMiddleware = (env: Env) => {
  return factory.createMiddleware(async (c, next) => {
    c.set("env", env);
    await next();
  });
};

export default envMiddleware;
