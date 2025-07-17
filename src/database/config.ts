import { defineConfig } from "drizzle-kit";
import env from "@/env";

// Drizzle configuration
export default defineConfig({
  dialect: "postgresql",
  schema: "./database/schema.ts",
  out: "./database/migrations/development",
  verbose: true,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
