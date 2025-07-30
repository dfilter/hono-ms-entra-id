import { getCookie, setCookie } from "hono/cookie";
import { CookieOptions } from "hono/utils/cookie";

import { acquireTokenByCode, cryptoProvider, getAuthCodeUrl } from "@/lib/msal";
import { findOrCreateUserInsertSession } from "@/db/queries/sessions.queries";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import { SessionInsert } from "@/db/schema/sessions";
import { UserInsert } from "@/db/schema/users";
import factory from "@/lib/hono";

export const loginHandler = factory.createHandlers(async (c) => {
  if (c.var.session) return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);

  const state = cryptoProvider.createNewGuid();
  const nonce = cryptoProvider.createNewGuid();

  const { error, data: url } = await getAuthCodeUrl({
    state,
    nonce,
    redirectUri: c.var.env.MSAL_REDIRECT_URL,
    scopes: c.var.env.MSAL_CLIENT_SCOPES,
  });
  if (error) {
    return c.text(
      ReasonPhrases.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR,
      { Location: "/" }
    );
  }

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: c.var.env.NODE_ENV === "production",
    sameSite: "Lax",
  };

  setCookie(c, "state", cryptoProvider.base64Encode(state), cookieOptions);
  setCookie(c, "nonce", cryptoProvider.base64Encode(nonce), cookieOptions);

  return c.redirect(url, StatusCodes.MOVED_TEMPORARILY);
});

export const loginCallbackHandler = factory.createHandlers(async (c) => {
  const url = new URL(c.req.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const stateCookie = cryptoProvider.base64Decode(
    getCookie(c, "state") ?? "invalid-cookie-state"
  );
  const nonce = cryptoProvider.base64Decode(
    getCookie(c, "nonce") ?? "not-a-valid-nonce"
  );

  if (!code || state !== stateCookie) {
    return c.text(ReasonPhrases.BAD_REQUEST, StatusCodes.BAD_REQUEST, {
      Location: "/",
    });
  }

  const { error: codeError, data: authResult } = await acquireTokenByCode({
    code,
    redirectUri: c.var.env.MSAL_REDIRECT_URL,
    scopes: c.var.env.MSAL_CLIENT_SCOPES,
  });
  if (codeError) {
    console.error(codeError);
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

  const token = await cryptoProvider.hashString(authResult.accessToken);
  const session: SessionInsert = {
    id: token,
    userId: account.localAccountId,
    accessToken: authResult.accessToken,
    expiresOn: authResult.expiresOn,
    scopes: authResult.scopes,
    tokenType: authResult.tokenType,
  };
  const user: UserInsert = {
    id: account.localAccountId,
    name: account.name ?? account.username,
    email: account.username,
    roles: account.idTokenClaims?.roles,
  };
  const { error: insertError } = await findOrCreateUserInsertSession(
    user,
    session
  );
  if (insertError) {
    console.error(insertError);
    return c.text(
      ReasonPhrases.INTERNAL_SERVER_ERROR,
      StatusCodes.INTERNAL_SERVER_ERROR,
      { Location: "/" }
    );
  }

  const encodedToken = cryptoProvider.base64Encode(token);
  setCookie(c, "token", encodedToken, {
    httpOnly: true,
    secure: c.var.env.NODE_ENV === "production",
    sameSite: "Lax",
    expires: authResult.expiresOn ?? undefined,
  });

  return c.redirect("/", StatusCodes.MOVED_TEMPORARILY);
});
