const DEFAULT_E2E_ORIGIN = "http://127.0.0.1:3100";
const SAFE_DATABASE_NAME_PATTERN = /(?:^|[_-])(?:e2e|test)(?:[_-]|$)/i;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "[::1]", "localhost"]);

export interface E2EEnvironment {
  databaseUrl: string;
  origin: string;
  port: number;
}

function getDatabaseTarget(url: URL): string {
  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  return `${url.port || "5432"}/${databaseName}`;
}

function isPlaywrightWorker(): boolean {
  return (
    /^\d+$/.test(process.env.TEST_WORKER_INDEX ?? "") &&
    /^\d+$/.test(process.env.TEST_PARALLEL_INDEX ?? "")
  );
}

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.E2E_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "E2E_DATABASE_URL is required. Use a dedicated database whose name contains 'e2e' or 'test'.",
    );
  }

  const url = new URL(databaseUrl);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("E2E_DATABASE_URL must use PostgreSQL.");
  }
  if (!LOCAL_HOSTNAMES.has(url.hostname)) {
    throw new Error("E2E_DATABASE_URL must point to a local database.");
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!SAFE_DATABASE_NAME_PATTERN.test(databaseName)) {
    throw new Error(
      `Refusing to run E2E tests against database "${databaseName}". Its name must contain a standalone 'e2e' or 'test' segment.`,
    );
  }
  if (
    process.env.CI !== "true" &&
    !isPlaywrightWorker() &&
    process.env.DATABASE_URL &&
    getDatabaseTarget(new URL(process.env.DATABASE_URL)) ===
      getDatabaseTarget(url)
  ) {
    throw new Error(
      "E2E_DATABASE_URL must differ from DATABASE_URL outside CI.",
    );
  }

  return databaseUrl;
}

function resolveOrigin(): { origin: string; port: number } {
  const rawOrigin = process.env.E2E_BASE_URL?.trim() || DEFAULT_E2E_ORIGIN;
  const url = new URL(rawOrigin);
  if (
    url.protocol !== "http:" ||
    !LOCAL_HOSTNAMES.has(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "E2E_BASE_URL must be a local HTTP origin without a path, query, or hash.",
    );
  }

  const port = Number(url.port || "80");
  if (!Number.isSafeInteger(port) || port <= 0) {
    throw new Error("E2E_BASE_URL must include a valid port.");
  }

  return { origin: url.origin, port };
}

export function resolveE2EEnvironment(): E2EEnvironment {
  return {
    databaseUrl: resolveDatabaseUrl(),
    ...resolveOrigin(),
  };
}
