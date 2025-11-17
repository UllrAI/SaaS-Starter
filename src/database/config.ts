import { defineConfig } from "drizzle-kit";
import env from "@/env";

// Drizzle configuration
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations/development",
  verbose: true,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
