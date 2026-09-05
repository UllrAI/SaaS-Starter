import postgres from "postgres";

const E2E_USER_ID_PATTERN = "e2e-%";
const E2E_TASK_SCOPE_PATTERN = "user:e2e-%";
const E2E_CLIENT_NAME = "Playwright CLI";
const MACHINE_AUTH_RATE_LIMIT_SCOPES = [
  "device_code",
  "device_pending",
  "device_refresh",
  "machine_user",
  "background_tasks",
];

export async function cleanupE2EFixtures(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for E2E fixture cleanup.");
  }

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    await sql.begin(async (transaction) => {
      await transaction`
        delete from pgboss.job
        where group_id like ${E2E_TASK_SCOPE_PATTERN}
      `;
      await transaction`
        delete from task_runs
        where "scopeKey" like ${E2E_TASK_SCOPE_PATTERN}
      `;
      await transaction`
        delete from device_codes
        where "clientName" = ${E2E_CLIENT_NAME}
           or "userId" like ${E2E_USER_ID_PATTERN}
      `;
      await transaction`
        delete from rate_limit_buckets
        where scope in ${transaction(MACHINE_AUTH_RATE_LIMIT_SCOPES)}
      `;
      await transaction`
        delete from users
        where id like ${E2E_USER_ID_PATTERN}
      `;
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}
