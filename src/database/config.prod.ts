import { defineConfig } from "drizzle-kit";
import env from "@/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./database/schema.ts",
  out: "./database/migrations/production",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
