import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for database commands.");
}

const protocol = new URL(databaseUrl).protocol;
if (protocol !== "postgres:" && protocol !== "postgresql:") {
  throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",
  verbose: true,
  dbCredentials: {
    url: databaseUrl,
  },
});
