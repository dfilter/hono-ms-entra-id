import path from "path";
import { serve } from "@hono/node-server";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import app from "@/app";
import env from "@/env";
import db from "@/db";

async function main() {
  if (env.NODE_ENV === "production") {
    console.log("🚀 Running migrations...");
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });
    console.log("✅ Migrations completed!");
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
