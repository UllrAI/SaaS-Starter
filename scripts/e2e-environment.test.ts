import { resolveE2EEnvironment } from "../e2e/environment";

const originalDatabaseUrl = process.env.E2E_DATABASE_URL;
const originalAppDatabaseUrl = process.env.DATABASE_URL;
const originalBaseUrl = process.env.E2E_BASE_URL;
const originalCI = process.env.CI;
const originalWorkerIndex = process.env.TEST_WORKER_INDEX;
const originalParallelIndex = process.env.TEST_PARALLEL_INDEX;

function restoreEnvValue(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

beforeEach(() => {
  delete process.env.E2E_DATABASE_URL;
  delete process.env.E2E_BASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.CI;
  delete process.env.TEST_WORKER_INDEX;
  delete process.env.TEST_PARALLEL_INDEX;
});

afterEach(() => {
  restoreEnvValue("E2E_DATABASE_URL", originalDatabaseUrl);
  restoreEnvValue("E2E_BASE_URL", originalBaseUrl);
  restoreEnvValue("DATABASE_URL", originalAppDatabaseUrl);
  restoreEnvValue("CI", originalCI);
  restoreEnvValue("TEST_WORKER_INDEX", originalWorkerIndex);
  restoreEnvValue("TEST_PARALLEL_INDEX", originalParallelIndex);
});

describe("resolveE2EEnvironment", () => {
  it("requires an explicit E2E database URL", () => {
    delete process.env.E2E_DATABASE_URL;

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL is required",
    );
  });

  it("rejects a database without an E2E or test name segment", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas";

    expect(() => resolveE2EEnvironment()).toThrow(
      'Refusing to run E2E tests against database "saas"',
    );
  });

  it("rejects a non-PostgreSQL database URL", () => {
    process.env.E2E_DATABASE_URL = "mysql://root:root@localhost:3306/saas_e2e";

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must use PostgreSQL",
    );
  });

  it("rejects a remote E2E database", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@db.example.com:5432/saas_e2e";

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must point to a local database",
    );
  });

  it("rejects the active development database outside CI", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    delete process.env.CI;

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must differ from DATABASE_URL outside CI",
    );
  });

  it("does not treat a false CI value as CI", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    process.env.CI = "false";

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must differ from DATABASE_URL outside CI",
    );
  });

  it("normalizes local host aliases, protocols, and default ports", () => {
    process.env.E2E_DATABASE_URL = "postgresql://e2e:e2e@127.0.0.1/saas_e2e";
    process.env.DATABASE_URL = "postgres://app:app@localhost:5432/saas_e2e";
    delete process.env.CI;

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must differ from DATABASE_URL outside CI",
    );
  });

  it("returns a dedicated database and the default local origin", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas";
    delete process.env.E2E_BASE_URL;

    expect(resolveE2EEnvironment()).toEqual({
      databaseUrl: "postgresql://postgres:postgres@localhost:5432/saas_e2e",
      origin: "http://127.0.0.1:3100",
      port: 3100,
    });
  });

  it("allows explicit database reuse in CI", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    process.env.CI = "true";

    expect(resolveE2EEnvironment().databaseUrl).toBe(
      process.env.E2E_DATABASE_URL,
    );
  });

  it("allows the validated database after Playwright starts a worker", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    process.env.TEST_WORKER_INDEX = "0";
    process.env.TEST_PARALLEL_INDEX = "0";

    expect(resolveE2EEnvironment().databaseUrl).toBe(
      process.env.E2E_DATABASE_URL,
    );
  });

  it("does not trust a partial Playwright worker marker", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_e2e";
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    process.env.TEST_WORKER_INDEX = "0";
    delete process.env.TEST_PARALLEL_INDEX;

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_DATABASE_URL must differ from DATABASE_URL outside CI",
    );
  });

  it("supports IPv6 loopback URLs", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@[::1]:5432/saas_e2e";
    process.env.DATABASE_URL = "postgresql://postgres:postgres@[::1]:5432/saas";
    process.env.E2E_BASE_URL = "http://[::1]:3100";

    expect(resolveE2EEnvironment()).toMatchObject({
      origin: "http://[::1]:3100",
      port: 3100,
    });
  });

  it("rejects non-local E2E origins", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_test";
    process.env.E2E_BASE_URL = "https://example.com";

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_BASE_URL must be a local HTTP origin",
    );
  });

  it("rejects credentials in the E2E origin", () => {
    process.env.E2E_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/saas_test";
    process.env.E2E_BASE_URL = "http://user:password@localhost:3100";

    expect(() => resolveE2EEnvironment()).toThrow(
      "E2E_BASE_URL must be a local HTTP origin",
    );
  });
});
