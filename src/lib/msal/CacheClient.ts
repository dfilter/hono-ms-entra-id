import type { ICachePlugin, ISerializableTokenCache, TokenCacheContext } from "@azure/msal-node";
import fs from "node:fs";


export class CacheClient implements ICachePlugin {
  private cacheLocation: string;

  constructor(cacheLocation: string) {
    this.cacheLocation = cacheLocation;
  }

  async writeCache(tokenCache: ISerializableTokenCache) {
    const tokenCacheSerialized = tokenCache.serialize();
    await fs.promises.writeFile(
      this.cacheLocation,
      tokenCacheSerialized,
      "utf-8"
    );
  }

  async afterCacheAccess(tokenCacheContext: TokenCacheContext) {
    if (!tokenCacheContext.cacheHasChanged) return;

    await this.writeCache(tokenCacheContext.tokenCache);
  }

  async beforeCacheAccess(tokenCacheContext: TokenCacheContext) {
    if (!tokenCacheContext.cacheHasChanged) return;

    if (!fs.existsSync(this.cacheLocation)) {
      await this.writeCache(tokenCacheContext.tokenCache);
      return;
    }

    const tokenCache = await fs.promises.readFile(this.cacheLocation, "utf-8");
    tokenCacheContext.tokenCache.deserialize(tokenCache);
  }
}
