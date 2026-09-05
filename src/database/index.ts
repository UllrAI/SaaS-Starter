import { createDatabaseClient } from "./client";
import env from "@/env";
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

const database = createDatabaseClient({
  url: databaseUrl,
  max: connectionConfig.max,
  idleTimeout: connectionConfig.idle_timeout,
  maxLifetime: connectionConfig.max_lifetime,
  connectTimeout: connectionConfig.connect_timeout,
  debug: "debug" in connectionConfig ? connectionConfig.debug : false,
});
const { sql } = database;
export const db = database.db;

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
export const closeDatabase = database.close;
