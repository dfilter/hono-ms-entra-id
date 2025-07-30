import {
  acquireTokenSilent,
  cryptoProvider,
  shouldTokenRefresh,
} from "@/lib/msal";

import {
  deleteSession,
  selectSession,
  findOrCreateUserInsertSession,
} from "@/db/queries/sessions.queries";
import { getCookie, setCookie } from "hono/cookie";
import factory from "@/lib/hono";

const sessionMiddleware = () => {
  return factory.createMiddleware(async (c, next) => {
    const token = getCookie(c, "token");
    if (!token) {
      await next();
      return;
    }

    const id = cryptoProvider.base64Decode(token);
    const session = await selectSession(id);
    if (session?.expiresOn && session.expiresOn.getTime() <= Date.now()) {
      await deleteSession(id);
      c.set("session", undefined);
      await next();
      return;
    }
    if (!session?.expiresOn || !shouldTokenRefresh(session.expiresOn)) {
      c.set("session", session);
      await next();
      return;
    }

    const { error, data: authResult } = await acquireTokenSilent({
      account: {
        environment: "login.windows.net",
        homeAccountId: `${session.userId}.${c.var.env.MSAL_TENANT_ID}`,
        localAccountId: session.userId,
        username: session.user.email,
        tenantId: c.var.env.MSAL_TENANT_ID,
      },
      scopes: c.var.env.MSAL_CLIENT_SCOPES,
      forceRefresh: true,
    });
    if (error) {
      await next();
      return;
    }

    const account = authResult.account;
    if (!account) {
      await next();
      return;
    }

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

    const { data } = await findOrCreateUserInsertSession(user, newSession);
    if (!data) {
      await next();
      return;
    }

    c.set("session", data);

    const encodedToken = cryptoProvider.base64Encode(newToken);
    setCookie(c, "token", encodedToken, {
      httpOnly: true,
      secure: c.var.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    await next();
  });
};

export default sessionMiddleware;
