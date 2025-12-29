import "@testing-library/jest-dom";

// Jest setup for test environment

// Type definitions for test mocks
export interface MockSession {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: "user" | "admin" | "super_admin";
  };
  sessionId?: string;
  expiresAt?: Date;
}

export interface MockSubscription {
  id: string;
  userId: string;
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  tier: string;
  mode: "subscription" | "one_time";
  cycle: "monthly" | "yearly";
  createdAt: Date;
  updatedAt: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export interface MockUser {
  id: string;
  email: string;
  name?: string;
  role: "user" | "admin" | "super_admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface MockCreemCheckout {
  id: string;
  status?:
    | "open"
    | "completed"
    | "expired"
    | "canceled"
    | "failed"
    | "pending"
    | "processing"
    | string;
  url?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

export interface MockApiResponse<T = unknown> {
  json: () => Promise<T>;
  status: number;
  ok: boolean;
  headers?: Record<string, string>;
}

export interface MockRequestInit extends RequestInit {
  nextUrl?: {
    searchParams: URLSearchParams;
    pathname: string;
  };
}

// Type-safe mock function creators with proper generic constraints
export function createMockFunction<T extends (...args: any[]) => any>(
  implementation?: T,
): jest.MockedFunction<T> {
  return (implementation
    ? jest.fn(implementation)
    : jest.fn()) as unknown as jest.MockedFunction<T>;
}

// Specific typed mock creators for common API patterns
export type MockApiHandler = jest.MockedFunction<
  (data: any, init?: { status?: number }) => any
>;
export type MockSessionFunction = jest.MockedFunction<
  () => Promise<MockSession | null>
>;
export type MockDatabaseFunction = jest.MockedFunction<
  (...args: any[]) => Promise<any[]>
>;
export type MockBillingFunction = jest.MockedFunction<
  (...args: any[]) => Promise<any>
>;
export type MockHeadersFunction = jest.MockedFunction<
  (name: string) => string | null
>;

// Type-safe mock creators for common patterns
export function createMockPromiseFunction<T>(
  resolvedValue: T,
): jest.MockedFunction<() => Promise<T>> {
  return jest
    .fn()
    .mockResolvedValue(resolvedValue) as unknown as jest.MockedFunction<
    () => Promise<T>
  >;
}

export function createMockAsyncFunction<TArgs extends any[], TReturn>(
  resolvedValue: TReturn,
): jest.MockedFunction<(...args: TArgs) => Promise<TReturn>> {
  return jest
    .fn()
    .mockResolvedValue(resolvedValue) as unknown as jest.MockedFunction<
    (...args: TArgs) => Promise<TReturn>
  >;
}

export function createMockSyncFunction<TArgs extends any[], TReturn>(
  returnValue: TReturn,
): jest.MockedFunction<(...args: TArgs) => TReturn> {
  return jest
    .fn()
    .mockReturnValue(returnValue) as unknown as jest.MockedFunction<
    (...args: TArgs) => TReturn
  >;
}

// Specific mock creators for NextJS API testing will be defined below

// Console utilities for test isolation
export function createMockConsole() {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

export function mockConsoleFor(testFn: () => void | Promise<void>) {
  const originalConsoleCopy = global.console;
  const mockConsole = createMockConsole();

  return async () => {
    global.console = { ...originalConsoleCopy, ...mockConsole };
    try {
      await testFn();
    } finally {
      global.console = originalConsoleCopy;
    }
  };
}

// Global console override for tests to suppress error noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  error: jest.fn(), // Suppress console.error in tests
  warn: jest.fn(), // Suppress console.warn in tests
};

// Create type-safe API response mock
export function createMockApiResponse<T = unknown>(
  data: T,
  status = 200,
): {
  json: () => Promise<T>;
  status: number;
  ok: boolean;
} {
  return {
    json: () => Promise.resolve(data),
    status,
    ok: status >= 200 && status < 300,
  };
}

// Typed mock creators
export const createMockSession = (
  overrides: Partial<MockSession> = {},
): MockSession => ({
  user: {
    id: "test-user-id",
    email: "test@example.com",
    role: "user",
    ...overrides.user,
  },
  sessionId: "test-session-id",
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  ...overrides,
});

export const createMockSubscription = (
  overrides: Partial<MockSubscription> = {},
): MockSubscription => ({
  id: "test-subscription-id",
  userId: "test-user-id",
  status: "active",
  tier: "pro",
  mode: "subscription",
  cycle: "monthly",
  createdAt: new Date(),
  updatedAt: new Date(),
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  ...overrides,
});

export const createMockUser = (
  overrides: Partial<MockUser> = {},
): MockUser => ({
  id: "test-user-id",
  email: "test@example.com",
  role: "user",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCreemCheckout = (
  overrides: Partial<MockCreemCheckout> = {},
): MockCreemCheckout => ({
  id: "test-checkout-id",
  status: "open",
  url: "https://test-checkout-url.com",
  customerId: "test-customer-id",
  metadata: {},
  ...overrides,
});

// Additional type-safe mock creators for common test patterns
export function createMockNextRequest(
  url: string = "http://localhost:3000",
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    nextUrl?: { pathname: string };
  } = {},
): MockNextRequest {
  return new MockNextRequest(url, {
    method: options.method || "GET",
    headers: options.headers,
    body: options.body ? JSON.stringify(options.body) : null,
    nextUrl: options.nextUrl,
  } as RequestInit & { nextUrl?: { pathname: string } });
}

export function createMockResponse<T = any>(
  data: T,
  options: { status?: number; headers?: Record<string, string> } = {},
): {
  json: () => Promise<T>;
  status: number;
  ok: boolean;
  headers?: Record<string, string>;
} {
  return {
    json: () => Promise.resolve(data),
    status: options.status || 200,
    ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
    headers: options.headers,
  };
}

// Type-safe jest mock function creators
export function createTypedMockFunction<
  T extends (...args: any[]) => any,
>(): jest.MockedFunction<T> {
  return jest.fn() as unknown as jest.MockedFunction<T>;
}

// Export SpyInstance type for tests that need it
export type SpyInstance = jest.SpyInstance<any, any>;

// Setup Web APIs for Node.js environment
const { TextEncoder, TextDecoder } = require("util");

// Simplified Mock Headers implementation
class MockHeaders {
  private headers: Map<string, string> = new Map();

  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (init instanceof Headers) {
        init.forEach((value, key) => this.set(key, value));
      } else if (typeof init === "object") {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  delete(name: string): boolean {
    return this.headers.delete(name.toLowerCase());
  }

  append(name: string, value: string): void {
    const existing = this.get(name);
    this.set(name, existing ? `${existing}, ${value}` : value);
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }

  keys(): IterableIterator<string> {
    return this.headers.keys();
  }

  values(): IterableIterator<string> {
    return this.headers.values();
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

// Mock ResponseCookies (for Next.js 15 compatibility)
class MockResponseCookies {
  private cookies = new Map<
    string,
    { value: string; options?: Record<string, unknown> }
  >();

  set(name: string, value: string, options?: Record<string, unknown>): void {
    this.cookies.set(name, { value, options });
  }

  get(
    name: string,
  ): { value: string; options?: Record<string, unknown> } | undefined {
    return this.cookies.get(name);
  }

  delete(name: string): void {
    this.cookies.delete(name);
  }

  getSetCookie(): string[] {
    return Array.from(this.cookies.entries()).map(
      ([name, { value, options }]) => {
        let cookie = `${name}=${value}`;
        if (options) {
          Object.entries(options).forEach(([key, val]) => {
            cookie += `; ${key}=${val}`;
          });
        }
        return cookie;
      },
    );
  }
}

// Mock Response with proper cookie support
class MockResponse {
  status: number;
  statusText: string;
  headers: MockHeaders;
  cookies: MockResponseCookies;
  body: ReadableStream<Uint8Array> | null;
  bodyUsed: boolean = false;
  ok: boolean;
  redirected: boolean = false;
  type: ResponseType = "basic";
  url: string = "";
  private _bodyData: string;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.status = init?.status || 200;
    this.statusText = init?.statusText || "OK";
    this.headers = new MockHeaders(init?.headers);
    this.cookies = new MockResponseCookies();
    this.ok = this.status >= 200 && this.status < 300;
    this.body = body ? new ReadableStream() : null;
    this._bodyData = typeof body === "string" ? body : "";
  }

  static json(data: unknown, init?: ResponseInit) {
    const response = new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
    return response;
  }

  async json(): Promise<unknown> {
    this.bodyUsed = true;
    try {
      return this._bodyData ? JSON.parse(this._bodyData) : {};
    } catch {
      return {};
    }
  }

  async text(): Promise<string> {
    this.bodyUsed = true;
    return Promise.resolve(this._bodyData);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    this.bodyUsed = true;
    return Promise.resolve(new ArrayBuffer(0));
  }

  async blob(): Promise<Blob> {
    this.bodyUsed = true;
    return Promise.resolve(new Blob());
  }

  clone(): MockResponse {
    const headersInit: Record<string, string> = {};
    this.headers.forEach((value, key) => {
      headersInit[key] = value;
    });
    return new MockResponse(this.body, {
      status: this.status,
      statusText: this.statusText,
      headers: headersInit,
    });
  }
}

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Request: global.Request || class MockRequest {},
  Response: global.Response || MockResponse,
  Headers: global.Headers || MockHeaders,
  fetch: global.fetch || jest.fn(),
  ReadableStream:
    global.ReadableStream ||
    class MockReadableStream {
      constructor() {}
      getReader() {
        return {
          read: () => Promise.resolve({ done: true }),
          releaseLock: () => {},
        };
      }
    },
  WritableStream:
    global.WritableStream ||
    class MockWritableStream {
      constructor() {}
      getWriter() {
        return {
          write: () => Promise.resolve(),
          close: () => Promise.resolve(),
        };
      }
    },
});

// Add URL if not present
if (typeof global.URL === "undefined") {
  global.URL = require("url").URL;
}

if (typeof global.URLSearchParams === "undefined") {
  global.URLSearchParams = require("url").URLSearchParams;
}

// Type-safe crypto module mock
type MockCrypto = {
  getRandomValues: jest.MockedFunction<(array: Uint8Array) => Uint8Array>;
  randomUUID: jest.MockedFunction<() => string>;
  subtle: Record<string, unknown>;
};

const mockCrypto: MockCrypto = {
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => "mock-uuid"),
  subtle: {},
};

// Mock crypto module to avoid ES module issues
jest.mock("uncrypto", () => mockCrypto, { virtual: true });

// Mock lingo react client to avoid ESM-only dependency in Jest
jest.mock("@lingo.dev/compiler/react", () => ({
  useLingoContext: () => ({
    locale: "en",
    setLocale: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
  }),
}));

// Type-safe better-auth mock
type BetterAuthConfig = Record<string, unknown>;
type BetterAuthInstance = {
  api: {
    getSession: jest.MockedFunction<() => Promise<MockSession | null>>;
    signIn: jest.MockedFunction<() => Promise<unknown>>;
    signOut: jest.MockedFunction<() => Promise<unknown>>;
    signUp: jest.MockedFunction<() => Promise<unknown>>;
  };
  handler: jest.MockedFunction<() => Promise<unknown>>;
  options: BetterAuthConfig;
};

const mockBetterAuth = jest.fn(
  (config: BetterAuthConfig): BetterAuthInstance => ({
    api: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    handler: jest.fn(),
    options: config,
  }),
);

// Mock better-auth to avoid ES module issues - comprehensive mock
jest.mock("better-auth", () => ({
  betterAuth: mockBetterAuth,
}));

// Mock better-auth plugins
jest.mock("better-auth/plugins", () => ({
  magicLink: jest.fn(() => ({})),
}));

// Mock better-auth adapters
jest.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: jest.fn(() => ({})),
}));

// Type-safe postgres mock
type PostgresConnection = {
  unsafe: jest.MockedFunction<
    () => { values: jest.MockedFunction<() => Promise<unknown[]>> }
  >;
  begin: jest.MockedFunction<
    () => Promise<{
      commit: jest.MockedFunction<() => Promise<void>>;
      rollback: jest.MockedFunction<() => Promise<void>>;
    }>
  >;
  end: jest.MockedFunction<() => Promise<void>>;
  options: Record<string, unknown>;
  parsers: Record<string, unknown>;
  serializers: Record<string, unknown>;
  transform: Record<string, unknown>;
} & jest.MockedFunction<() => Promise<{ testValue: number }[]>>;

const createMockPostgresConnection = (): PostgresConnection => {
  const mockSql = Object.assign(
    jest.fn(() => Promise.resolve([{ testValue: 1 }])) as jest.MockedFunction<
      () => Promise<{ testValue: number }[]>
    >,
    {
      unsafe: jest.fn().mockReturnValue({
        values: jest.fn(() => Promise.resolve([])),
      }),
      begin: jest.fn(() =>
        Promise.resolve({ commit: jest.fn(), rollback: jest.fn() }),
      ),
      end: jest.fn(() => Promise.resolve()),
      options: {
        parsers: {},
        serializers: {},
        transform: {},
      },
      parsers: {},
      serializers: {},
      transform: {},
    },
  ) as PostgresConnection;
  return mockSql;
};

const mockPostgres = jest.fn(createMockPostgresConnection) as any;

// Mock postgres to prevent actual database connections
jest.mock("postgres", () => mockPostgres);

// Type-safe Drizzle ORM mocks
type MockQueryResult<T = unknown> = Promise<T[]>;
type MockQueryBuilder = {
  returning: jest.MockedFunction<() => MockQueryResult>;
};

const mockReturning: jest.MockedFunction<() => MockQueryResult> = jest
  .fn()
  .mockResolvedValue([]);
const mockOnConflictDoUpdate: jest.MockedFunction<
  (config: unknown) => MockQueryBuilder
> = jest.fn().mockReturnValue({ returning: mockReturning });
const mockOnConflictDoNothing: jest.MockedFunction<() => MockQueryResult> = jest
  .fn()
  .mockResolvedValue([]);
const mockValues: jest.MockedFunction<
  (values: unknown) => {
    onConflictDoUpdate: typeof mockOnConflictDoUpdate;
    onConflictDoNothing: typeof mockOnConflictDoNothing;
  }
> = jest.fn().mockReturnValue({
  onConflictDoUpdate: mockOnConflictDoUpdate,
  onConflictDoNothing: mockOnConflictDoNothing,
});
const mockInsert: jest.MockedFunction<() => { values: typeof mockValues }> =
  jest.fn().mockReturnValue({ values: mockValues });
const mockLimit: jest.MockedFunction<(count: number) => MockQueryResult> = jest
  .fn()
  .mockResolvedValue([]);
const mockOrderBy: jest.MockedFunction<
  (field: unknown) => { limit: typeof mockLimit }
> = jest.fn().mockReturnValue({ limit: mockLimit });
const mockOrderByDirect: jest.MockedFunction<
  (field: unknown) => MockQueryResult
> = jest.fn().mockResolvedValue([]);
const mockWhere: jest.MockedFunction<
  (condition: unknown) => {
    orderBy: typeof mockOrderByDirect;
    limit: typeof mockLimit;
  }
> = jest.fn().mockReturnValue({
  orderBy: mockOrderByDirect,
  limit: mockLimit,
});
const mockFrom: jest.MockedFunction<
  (table: unknown) => { where: typeof mockWhere; orderBy: typeof mockOrderBy }
> = jest.fn().mockReturnValue({
  where: mockWhere,
  orderBy: mockOrderBy,
});
const mockSelect: jest.MockedFunction<
  () => { from: typeof mockFrom; orderBy: typeof mockOrderBy }
> = jest.fn().mockReturnValue({
  from: mockFrom,
  orderBy: mockOrderBy,
});

// Type-safe database connection mocks
type MockDatabase = {
  insert: typeof mockInsert;
  select: typeof mockSelect;
};

type MockSqlFunction = jest.MockedFunction<
  () => Promise<{ testValue: number }[]>
>;
type MockCloseDatabaseFunction = jest.MockedFunction<() => Promise<void>>;

const mockSql: MockSqlFunction = jest.fn(() =>
  Promise.resolve([{ testValue: 1 }]),
);
const mockCloseDatabase: MockCloseDatabaseFunction = jest.fn(() =>
  Promise.resolve(),
);

// Mock database connection to prevent real database access
jest.mock("./src/database", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  } as MockDatabase,
  sql: mockSql,
  closeDatabase: mockCloseDatabase,
}));

jest.mock("./src/database/index", () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  } as MockDatabase,
  sql: mockSql,
  closeDatabase: mockCloseDatabase,
}));

// Type-safe Drizzle ORM function mocks
type DrizzleCondition = {
  field?: unknown;
  value?: unknown;
  type: string;
  conditions?: unknown[];
};

const mockEq = jest.fn().mockImplementation(
  (field: unknown, value: unknown): DrizzleCondition => ({
    field,
    value,
    type: "eq",
  }),
);
const mockDesc = jest
  .fn()
  .mockImplementation(
    (field: unknown): DrizzleCondition => ({ field, type: "desc" }),
  );
const mockAnd = jest.fn().mockImplementation(
  (...conditions: unknown[]): DrizzleCondition => ({
    conditions,
    type: "and",
  }),
);

// Mock Drizzle ORM functions
jest.mock("drizzle-orm", () => ({
  eq: mockEq,
  desc: mockDesc,
  and: mockAnd,
}));

// Type-safe environment configuration mock
type MockEnvironment = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  RESEND_API_KEY: string;
  AWS_S3_BUCKET: string;
  AWS_S3_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  CLOUDFLARE_R2_ENDPOINT: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
  CREEM_API_KEY: string;
  CREEM_SECRET_KEY: string;
  CREEM_WEBHOOK_SECRET: string;
  DB_POOL_SIZE: number;
  DB_IDLE_TIMEOUT: number;
  DB_MAX_LIFETIME: number;
  DB_CONNECT_TIMEOUT: number;
};

const mockEnvConfig: MockEnvironment = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
  BETTER_AUTH_SECRET: "mock-secret",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  RESEND_API_KEY: "mock-resend-key",
  AWS_S3_BUCKET: "mock-bucket",
  AWS_S3_REGION: "us-east-1",
  AWS_ACCESS_KEY_ID: "mock-access-key",
  AWS_SECRET_ACCESS_KEY: "mock-secret-key",
  CLOUDFLARE_R2_ENDPOINT: "mock-endpoint",
  CLOUDFLARE_R2_ACCESS_KEY_ID: "mock-r2-key",
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: "mock-r2-secret",
  CREEM_API_KEY: "mock-creem-api-key",
  CREEM_SECRET_KEY: "mock-creem-secret",
  CREEM_WEBHOOK_SECRET: "mock-webhook-secret",
  DB_POOL_SIZE: 20,
  DB_IDLE_TIMEOUT: 300,
  DB_MAX_LIFETIME: 14400,
  DB_CONNECT_TIMEOUT: 30,
};

const mockCreateEnv = jest.fn(() => mockEnvConfig);

// Mock env configuration
jest.mock("@t3-oss/env-nextjs", () => ({
  createEnv: mockCreateEnv,
}));

// Mock Next.js server components with proper cookie support
class MockNextResponse extends MockResponse {
  static json(data: unknown, init?: ResponseInit) {
    const response = new MockNextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...init?.headers,
      },
    });
    return response;
  }

  static redirect(url: string | URL, init?: ResponseInit) {
    return new MockNextResponse(null, {
      ...init,
      status: init?.status || 302,
      headers: {
        location: url.toString(),
        ...init?.headers,
      },
    });
  }

  static rewrite(destination: string | URL) {
    return new MockNextResponse(null, {
      headers: {
        "x-middleware-rewrite": destination.toString(),
      },
    });
  }

  static next() {
    return new MockNextResponse(null, {
      headers: {
        "x-middleware-next": "1",
      },
    });
  }
}

// Mock NextRequest with proper typing
class MockNextRequest {
  url: string;
  method: string;
  headers: MockHeaders;
  body: ReadableStream<Uint8Array> | null;
  cookies: {
    get: (name: string) => { value: string } | null;
    getAll: () => { name: string; value: string }[];
    has: (name: string) => boolean;
    set: (name: string, value: string) => void;
    delete: (name: string) => void;
  };
  nextUrl: {
    pathname: string;
    searchParams: URLSearchParams;
    href: string;
    origin: string;
  };
  geo?: {
    city?: string;
    country?: string;
    region?: string;
  };
  ip?: string;

  constructor(
    input: string | URL,
    init?: RequestInit & { nextUrl?: { pathname: string } },
  ) {
    this.url = typeof input === "string" ? input : input.toString();
    this.method = init?.method || "GET";
    this.headers = new MockHeaders(init?.headers);
    this.body = init?.body as ReadableStream<Uint8Array> | null;

    const url = new URL(this.url);
    this.nextUrl = {
      pathname: init?.nextUrl?.pathname || url.pathname,
      searchParams: url.searchParams,
      href: this.url,
      origin: url.origin,
    };

    this.cookies = {
      get: () => null,
      getAll: () => [],
      has: () => false,
      set: () => {},
      delete: () => {},
    };
  }

  async json(): Promise<any> {
    return Promise.resolve({});
  }

  async text(): Promise<string> {
    return Promise.resolve("");
  }

  async formData(): Promise<FormData> {
    return Promise.resolve(new FormData());
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  clone(): MockNextRequest {
    return new MockNextRequest(this.url, { method: this.method });
  }
}

// Mock next/server module
jest.mock("next/server", () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
}));

// Type-safe next-safe-action mock
type SafeActionClient = {
  use: jest.MockedFunction<(middleware: unknown) => SafeActionClient>;
  outputSchema: jest.MockedFunction<(schema: unknown) => SafeActionClient>;
  action: jest.MockedFunction<(actionFn: unknown) => SafeActionClient>;
  metadata: jest.MockedFunction<(meta: unknown) => SafeActionClient>;
};

const createMockSafeActionClient = (): SafeActionClient => {
  const client: SafeActionClient = {} as SafeActionClient;
  client.use = jest.fn().mockReturnValue(client);
  client.outputSchema = jest.fn().mockReturnValue(client);
  client.action = jest.fn().mockReturnValue(client);
  client.metadata = jest.fn().mockReturnValue(client);
  return client;
};

const mockCreateSafeActionClient = jest.fn(createMockSafeActionClient);

// Mock next-safe-action to avoid ES module issues
jest.mock("next-safe-action", () => ({
  createSafeActionClient: mockCreateSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE: "Something went wrong",
}));

// Mock the env.js file
jest.mock("./env.js", () => ({
  __esModule: true,
  default: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
    BETTER_AUTH_SECRET: "mock-secret",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    RESEND_API_KEY: "mock-resend-key",
    R2_ENDPOINT: "https://mock-endpoint.r2.cloudflarestorage.com",
    R2_ACCESS_KEY_ID: "mock-access-key",
    R2_SECRET_ACCESS_KEY: "mock-secret-key",
    R2_BUCKET_NAME: "mock-bucket",
    R2_PUBLIC_URL: "https://mock-public-url.com",
    CREEM_API_KEY: "mock-creem-api-key",
    CREEM_ENVIRONMENT: "test_mode",
    CREEM_WEBHOOK_SECRET: "mock-webhook-secret",
    DB_POOL_SIZE: 20,
    DB_IDLE_TIMEOUT: 300,
    DB_MAX_LIFETIME: 14400,
    DB_CONNECT_TIMEOUT: 30,
  },
}));
