import factory from "@/lib/hono";
import { html } from "hono/html";

const indexHandler = factory.createHandlers(
  (c) => {
    const session = c.get("session");
    return c.html(
      html`
<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hono MS Entra ID</title>
  <head prefix="og: http://ogp.me/ns#">
  <meta property="og:type" content="article">
</head>
<body>
  <a href="/login">Login</a>
  <a href="/logout">Logout</a>
  <h1>Session</h1>
  <pre>${JSON.stringify(session, undefined, 2)}</pre>
</body>
</html>`,
      200
    );
  },
  (c) => {
    return c.text("");
  }
);

export default indexHandler;
