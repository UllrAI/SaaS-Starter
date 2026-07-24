import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import env from "@/env";
import * as tables from "./tables";
import {
  getConnectionConfig,
  validateDatabaseConfig,
} from "@/lib/database/connection";

// Use unified database URL
const databaseUrl = env.DATABASE_URL;

// Get environment-appropriate connection configuration
const connectionConfig = getConnectionConfig();

// Validate and log configuration in development
if (process.env.NODE_ENV === "development") {
  validateDatabaseConfig();
}

// Set up the SQL client with dynamic configuration
const sql = postgres(databaseUrl, connectionConfig);

// Initialize the database with drizzle and schema
export const db = drizzle(sql, { schema: { ...tables } });

export async function checkDatabaseReadiness(timeoutMs = 4_000): Promise<void> {
  const query = sql`select 1`;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      query,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          query.cancel();
          reject(new Error("Database readiness check timed out."));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

// Graceful shutdown function for cleanup
export const closeDatabase = async () => {
  await sql.end({ timeout: 5 });
};
