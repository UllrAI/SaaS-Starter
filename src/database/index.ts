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

// Export the sql client for direct queries if needed
export { sql };

// Graceful shutdown function for cleanup
export const closeDatabase = async () => {
  await sql.end({ timeout: 5 });
};
