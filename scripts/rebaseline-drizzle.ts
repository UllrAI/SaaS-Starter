import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";
import env from "@/env";

type MigrationEntry = {
  idx: number;
  when: number;
  tag: string;
  breakpoints: boolean;
};

type MigrationJournal = {
  version: string;
  dialect: string;
  entries: MigrationEntry[];
};

type ResolvedMigration = {
  tag: string;
  createdAt: number;
  hash: string;
};

const requiredTables = [
  "accounts",
  "payments",
  "sessions",
  "subscriptions",
  "uploads",
  "users",
  "verifications",
  "webhook_events",
] as const;

const requiredColumns: Record<string, string[]> = {
  users: ["role", "banned", "banReason", "banExpires"],
  sessions: ["impersonatedBy"],
};

function loadMigrations(): ResolvedMigration[] {
  const migrationsDir = path.join(process.cwd(), "src/database/migrations");
  const journalPath = path.join(migrationsDir, "meta/_journal.json");
  const journal = JSON.parse(
    readFileSync(journalPath, "utf8"),
  ) as MigrationJournal;

  return journal.entries
    .sort((left, right) => left.idx - right.idx)
    .map((entry) => {
      const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
      const sql = readFileSync(sqlPath, "utf8");

      return {
        tag: entry.tag,
        createdAt: entry.when,
        hash: createHash("sha256").update(sql).digest("hex"),
      };
    });
}

async function assertDatabaseMatchesBaseline(sql: postgres.Sql) {
  const tables = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  `;

  const existingTables = new Set(tables.map((table) => table.table_name));
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length > 0) {
    throw new Error(
      `Database is missing required tables: ${missingTables.join(", ")}`,
    );
  }

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    const result = await sql<{ column_name: string }[]>`
      select column_name
      from information_schema.columns
      where table_schema = 'public' and table_name = ${tableName}
    `;

    const existingColumns = new Set(result.map((column) => column.column_name));
    const missingColumns = columns.filter((column) => !existingColumns.has(column));

    if (missingColumns.length > 0) {
      throw new Error(
        `Table "${tableName}" is missing required columns: ${missingColumns.join(", ")}`,
      );
    }
  }
}

async function main() {
  const migrations = loadMigrations();

  if (migrations.length === 0) {
    throw new Error("No migrations found in src/database/migrations");
  }

  const sql = postgres(env.DATABASE_URL, {
    max: 1,
  });

  try {
    const [{ name: databaseName }] = await sql<{ name: string }[]>`
      select current_database() as name
    `;

    await assertDatabaseMatchesBaseline(sql);

    await sql`create schema if not exists drizzle`;
    await sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `;

    await sql.begin(async (transaction) => {
      await transaction.unsafe("delete from drizzle.__drizzle_migrations");

      for (const migration of migrations) {
        await transaction.unsafe(
          "insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)",
          [migration.hash, migration.createdAt],
        );
      }
    });

    console.log(
      `Rebased ${databaseName} to ${migrations.length} migration record(s): ${migrations
        .map((migration) => migration.tag)
        .join(", ")}`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`Error: ${message}`);
  process.exit(1);
});
