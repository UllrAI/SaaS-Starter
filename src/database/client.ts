import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { utcConnectionOptions } from "./connection-options";
import * as tables from "./tables";

export interface DatabaseClientOptions {
  url: string;
  max: number;
  idleTimeout?: number;
  maxLifetime?: number;
  connectTimeout?: number;
  debug?: boolean;
}

export function createDatabaseClient(options: DatabaseClientOptions) {
  const sql = postgres(options.url, {
    max: options.max,
    idle_timeout: options.idleTimeout ?? 300,
    max_lifetime: options.maxLifetime ?? 14_400,
    connect_timeout: options.connectTimeout ?? 4,
    debug: options.debug ?? false,
    ...utcConnectionOptions,
    onnotice: options.debug ? console.log : () => {},
  });

  return {
    db: drizzle(sql, { schema: { ...tables } }),
    sql,
    close: () => sql.end({ timeout: 5 }),
  };
}

export type AppDatabase = ReturnType<typeof createDatabaseClient>["db"];

type AppTransaction = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];
export type DatabaseExecutor = AppDatabase | AppTransaction;
