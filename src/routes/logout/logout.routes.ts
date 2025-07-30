import { deleteCookie, getCookie } from "hono/cookie";
import { StatusCodes } from "http-status-codes";

import { deleteSessions } from "@/db/queries/sessions.queries";
import { cryptoProvider } from "@/lib/msal";
import factory from "@/lib/hono";

const logoutHandlers = factory.createHandlers(async (c) => {
  const encodedToken = getCookie(c, "token");
  if (!encodedToken) return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);

  const token = cryptoProvider.base64Decode(encodedToken);
  deleteCookie(c, "token");
  await deleteSessions(token);

  return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);
});

export default logoutHandlers;
