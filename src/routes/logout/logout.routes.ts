import { deleteCookie, getCookie } from "hono/cookie";
import { StatusCodes } from "http-status-codes";

import { deleteSessions } from "@/db/queries/sessions.queries";
import { createRouter } from "@/lib/create-app";
import { cryptoProvider } from "@/lib/msal";

const logoutRouter = createRouter();

logoutRouter.get("/logout", async (c) => {
  const encodedToken = getCookie(c, "token");
  if (!encodedToken) return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);

  const token = cryptoProvider.base64Decode(encodedToken);
  deleteCookie(c, "token");
  await deleteSessions(token);

  return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);
});

export default logoutRouter;
