import { defineConfig } from "drizzle-kit";
import env from "@/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations/production",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
