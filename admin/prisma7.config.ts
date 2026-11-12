import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Seeding is owned by the `site` project (prisma/seed.ts there) — both
    // projects share this same database, no need to duplicate it here.
    path: "prisma/migrations",
  },
  datasource: {
    // Direct (non-pooled) connection: required for migrations/DDL.
    // The running app uses DATABASE_URL (pooled) instead — see lib/prisma.ts.
    url: process.env["DIRECT_URL"],
  },
});
