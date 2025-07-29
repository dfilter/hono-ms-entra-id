import { tryCatch } from "@/lib/error-handling";
import type {
  ICachePlugin,
  ISerializableTokenCache,
  TokenCacheContext,
} from "@azure/msal-node";
import fs from "node:fs";
import path from "path";

export default class CacheClient implements ICachePlugin {
  static cacheFilePath = path.join(process.cwd(), "cache");
  static cacheFile = path.join(CacheClient.cacheFilePath, "cache.json");

  static createCacheFileDir = tryCatch(
    async () =>
      await fs.promises.mkdir(CacheClient.cacheFilePath, { recursive: true })
  );

  writeCache = tryCatch(async (tokenCache: ISerializableTokenCache) => {
    const tokenCacheSerialized = tokenCache.serialize();
    await fs.promises.writeFile(
      CacheClient.cacheFile,
      tokenCacheSerialized,
      "utf-8"
    );
  });

  readCache = tryCatch(
    async () => await fs.promises.readFile(CacheClient.cacheFile, "utf-8")
  );

  async afterCacheAccess(tokenCacheContext: TokenCacheContext) {
    if (!tokenCacheContext.cacheHasChanged) return;

    await this.writeCache(tokenCacheContext.tokenCache);
  }

  async beforeCacheAccess(tokenCacheContext: TokenCacheContext) {
    if (!tokenCacheContext.cacheHasChanged) return;

    if (!fs.existsSync(CacheClient.cacheFile)) {
      await this.writeCache(tokenCacheContext.tokenCache);
      return;
    }

    const { error, data } = await this.readCache();
    if (error) return;
    tokenCacheContext.tokenCache.deserialize(data);
  }
}
