import {
  ConfidentialClientApplication,
  CryptoProvider,
  LogLevel,
} from "@azure/msal-node";

import env from "@/env";
import CachePlugin from "@/lib/msal/CachePlugin";

export const cryptoProvider = new CryptoProvider();

export function createState() {
  const guid = cryptoProvider.createNewGuid();
  return cryptoProvider.base64Encode(guid);
}

export function shouldTokenRefresh(
  expiresOn: Date,
  gracePeriod: number = 60000 /* one minute */
) {
  return Date.now() + gracePeriod <= expiresOn.getDate();
}

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: env.MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${env.MSAL_TENANT_ID}`,
    clientSecret: env.MSAL_CLIENT_SECRET,
  },
  cache: {
    cachePlugin: new CachePlugin(),
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
      loggerCallback(logLevel, message) {
        console.error(message);
      },
    },
  },
});

export default cca;
