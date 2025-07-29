import type { AuthenticationResult } from "@azure/msal-node";
import { getCookie, setCookie } from "hono/cookie";
import { CookieOptions } from "hono/utils/cookie";

import env from "@/env";
import { createRouter } from "@/lib/create-app";
import cca, { createState, cryptoProvider } from "@/lib/msal";
import { findOrCreateUserInsertSession } from "@/db/queries/sessions.queries";
import { getSession } from "@/lib/session.helpers";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

const secure = env.NODE_ENV === "production";
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "Lax",
};
const scopes = env.MSAL_CLIENT_SCOPES;

const loginRouter = createRouter();

loginRouter.get("/login", async (c) => {
  const session = await getSession(c);
  if (session) return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);

  const state = createState();
  const nonce = createState();

  const url = await cca.getAuthCodeUrl({
    state,
    nonce,
    redirectUri: env.MSAL_REDIRECT_URL,
    scopes,
  });

  setCookie(c, "state", state, cookieOptions);
  setCookie(c, "nonce", nonce, cookieOptions);

  return c.redirect(url, StatusCodes.MOVED_TEMPORARILY);
});

loginRouter.get("/login/callback", async (c) => {
  const url = new URL(c.req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const stateCookie = getCookie(c, "state");
  const nonce = getCookie(c, "nonce") ?? undefined;

  if (!code || state !== stateCookie) {
    return c.text(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST, {
      Location: "/",
    });
  }

  let authResult: AuthenticationResult;
  try {
    authResult = await cca.acquireTokenByCode(
      {
        code,
        redirectUri: env.MSAL_REDIRECT_URL,
        scopes,
      },
      { code, nonce, state }
    );
  } catch (e) {
    console.error(e);
    return c.text(
      ReasonPhrases.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR,
      { Location: "/" }
    );
  }

  const account = authResult.account;
  if (!account) {
    const message = "No account info attached to token.";
    console.error(
      new Error(message + " Ensure scopes are correct.", { cause: authResult })
    );
    return c.text(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST, {
      Location: "/",
    });
  }

  const token = await cryptoProvider.hashString(authResult.uniqueId);
  const session = {
    id: token,
    userId: account.localAccountId,
    accessToken: authResult.accessToken,
    expiresOn: authResult.expiresOn,
    scopes: authResult.scopes,
    tokenType: authResult.tokenType,
  };
  const user = {
    id: account.localAccountId,
    name: account.name ?? account.username,
    email: account.username,
    roles: account.idTokenClaims?.roles,
  };
  const { error, data } = await findOrCreateUserInsertSession(user, session);
  if (error) {
    return c.text(
      ReasonPhrases.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR,
      { Location: "/" }
    );
  }

  const encodedToken = cryptoProvider.base64Encode(token);
  setCookie(c, "token", encodedToken, {
    ...cookieOptions,
    expires: authResult.expiresOn ?? undefined,
  });

  return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);
});

export default loginRouter;
