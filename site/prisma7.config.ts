import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Direct (non-pooled) connection: required for migrations/DDL.
    // The running app uses DATABASE_URL (pooled) instead — see lib/prisma.ts.
    url: process.env["DIRECT_URL"],
  },
});
