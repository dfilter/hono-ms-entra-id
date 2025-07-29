import { requestId } from "hono/request-id";
import { logger } from 'hono/logger';
import { Hono } from "hono";


export function createRouter() {
  return new Hono();
}

export function protectRoute(app: Hono) {
  app.use(async (c, next) => {

  })
}

export default function createApp() {
  const app = createRouter();

  app
    .use(requestId())
    .use(logger());

  return app;
}
