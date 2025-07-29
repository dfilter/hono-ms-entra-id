import path from "node:path";
import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import app from "@/app";
import env from "@/env";
import db from "@/db";
import CachePlugin from "@/lib/msal/CachePlugin";

async function main() {
  if (env.NODE_ENV === "production") {
    console.log("🚀 Running migrations...");
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("✅ Migrations completed!");
  }

  const { error } = await CachePlugin.createCacheFileDir();
  if (error) {
    console.error(error);
    process.exit(1);
  }

  serve(
    {
      fetch: app.fetch,
      port: env.PORT,
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`);
    }
  );
}

void main();
