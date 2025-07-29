import cca, { cryptoProvider, shouldTokenRefresh } from "@/lib/msal";
import { Context } from "hono";
import { CookieOptions } from "hono/utils/cookie";

import env from "@/env";
import {
    deleteSession,
  selectSession,
  upsertUserInsertSession,
} from "@/db/queries/sessions.queries";
import { getCookie, setCookie } from "hono/cookie";

const secure = env.NODE_ENV === "production";
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure,
  sameSite: "Lax",
};
const scopes = [
  env.MSAL_CLIENT_SCOPE,
  "User.Read",
  "email",
  "profile",
  "openid",
  "offline_access",
];

export async function getSession(c: Context) {
  const token = getCookie(c, "token");
  if (!token) return;

  const id = cryptoProvider.base64Decode(token);
  const session = await selectSession(id);
  if (session?.expiresOn && session.expiresOn.getDate() <= Date.now()) {
    await deleteSession(id);
    return;
  }
  if (!session?.expiresOn || !shouldTokenRefresh(session.expiresOn)) {
    return session;
  }

  const authResult = await cca.acquireTokenSilent({
    account: {
      environment: "login.windows.net",
      homeAccountId: `${session.userId}.${env.MSAL_TENANT_ID}`,
      localAccountId: session.userId,
      username: session.user.email,
      tenantId: env.MSAL_TENANT_ID,
    },
    scopes,
    forceRefresh: true,
  });

  const account = authResult.account;
  if (!account) return;

  const newToken = await cryptoProvider.hashString(authResult.uniqueId);
  const newSession = {
    id: newToken,
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

  const { data } = await upsertUserInsertSession(user, newSession);
  if (!data) return;

  const encodedToken = cryptoProvider.base64Encode(newToken);
  setCookie(c, "token", encodedToken, cookieOptions);

  return data;
}
