import { describe, expect, it } from "@jest/globals";
import { loadWorkerEnv } from "./worker-env";

describe("worker environment", () => {
  it("uses the application database for jobs by default", () => {
    const env = loadWorkerEnv({
      DATABASE_URL: "postgresql://worker:worker@localhost/app",
    });

    expect(env.JOB_DATABASE_URL).toBe(env.DATABASE_URL);
    expect(env.DB_POOL_SIZE).toBe(5);
    expect(env.JOB_DB_POOL_SIZE).toBe(3);
    expect(env.WORKER_GRACEFUL_TIMEOUT_MS).toBe(30_000);
  });

  it("accepts a separate queue database and explicit pool budgets", () => {
    const env = loadWorkerEnv({
      DATABASE_URL: "postgresql://worker:worker@localhost/app",
      JOB_DATABASE_URL: "postgresql://worker:worker@localhost/jobs",
      DB_POOL_SIZE: "4",
      JOB_DB_POOL_SIZE: "2",
      WORKER_GRACEFUL_TIMEOUT_MS: "45000",
    });

    expect(env.JOB_DATABASE_URL).toContain("/jobs");
    expect(env.DB_POOL_SIZE).toBe(4);
    expect(env.JOB_DB_POOL_SIZE).toBe(2);
    expect(env.WORKER_GRACEFUL_TIMEOUT_MS).toBe(45_000);
  });

  it("rejects non-PostgreSQL and invalid pool configuration", () => {
    expect(() =>
      loadWorkerEnv({ DATABASE_URL: "mysql://localhost/app" }),
    ).toThrow("Invalid worker environment");
    expect(() =>
      loadWorkerEnv({
        DATABASE_URL: "postgresql://localhost/app",
        JOB_DB_POOL_SIZE: "0",
      }),
    ).toThrow("Invalid worker environment");
  });
});
