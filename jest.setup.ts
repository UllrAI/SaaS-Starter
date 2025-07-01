import "@testing-library/jest-dom";

// Setup Web APIs for Node.js environment
const { TextEncoder, TextDecoder } = require('util');

class MockResponse {
  static json(data: unknown, init?: { status?: number }) {
    return {
      json: async () => data,
      status: init?.status || 200,
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    };
  }
}

Object.assign(global, {
  TextEncoder,
  TextDecoder,
  Request: global.Request || class MockRequest {},
  Response: global.Response || MockResponse,
  Headers: global.Headers || class MockHeaders {
    constructor() {}
    set() {}
    get() { return ''; }
    has() { return false; }
  },
  fetch: global.fetch || jest.fn(),
  ReadableStream: global.ReadableStream || class MockReadableStream {
    constructor() {}
    getReader() { return { read: () => Promise.resolve({ done: true }), releaseLock: () => {} }; }
  },
  WritableStream: global.WritableStream || class MockWritableStream {
    constructor() {}
    getWriter() { return { write: () => Promise.resolve(), close: () => Promise.resolve() }; }
  },
  TransformStream: global.TransformStream || class MockTransformStream {
    readable: ReadableStream<unknown>;
    writable: WritableStream<unknown>;
    constructor() {
      this.readable = new (global.ReadableStream as new () => ReadableStream<unknown>)();
      this.writable = new (global.WritableStream as new () => WritableStream<unknown>)();
    }
  },
});

// Add URL if not present
if (typeof global.URL === 'undefined') {
  global.URL = require('url').URL;
}

if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = require('url').URLSearchParams;
}

// Mock crypto module to avoid ES module issues
jest.mock('uncrypto', () => ({
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => 'mock-uuid'),
  subtle: {},
}));

// Mock better-auth to avoid ES module issues - comprehensive mock
jest.mock('better-auth', () => ({
  betterAuth: jest.fn((config) => ({
    api: {
      getSession: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
    },
    handler: jest.fn(),
    options: config,
  })),
}));

// Mock better-auth plugins
jest.mock('better-auth/plugins', () => ({
  magicLink: jest.fn(() => ({})),
}));

// Mock better-auth adapters
jest.mock('better-auth/adapters/drizzle', () => ({
  drizzleAdapter: jest.fn(() => ({})),
}));

// Mock postgres to prevent actual database connections
jest.mock('postgres', () => {
  const mockSql = Object.assign(
    jest.fn(() => Promise.resolve([{ testValue: 1 }])),
    {
      unsafe: jest.fn().mockReturnValue({
        values: jest.fn(() => Promise.resolve([])),
      }),
      begin: jest.fn(() => Promise.resolve({ commit: jest.fn(), rollback: jest.fn() })),
      end: jest.fn(() => Promise.resolve()),
      options: {
        parsers: {},
        serializers: {},
        transform: {},
      },
      parsers: {},
      serializers: {},
      transform: {},
    }
  );
  return jest.fn(() => mockSql);
});

// Mock Drizzle ORM completely
const mockReturning = jest.fn().mockResolvedValue([]);
const mockOnConflictDoUpdate = jest.fn().mockReturnValue({ returning: mockReturning });
const mockOnConflictDoNothing = jest.fn().mockResolvedValue([]);
const mockValues = jest.fn().mockReturnValue({ 
  onConflictDoUpdate: mockOnConflictDoUpdate,
  onConflictDoNothing: mockOnConflictDoNothing
});
const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
const mockLimit = jest.fn().mockResolvedValue([]);
const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
const mockOrderByDirect = jest.fn().mockResolvedValue([]);
const mockWhere = jest.fn().mockReturnValue({ 
  orderBy: mockOrderByDirect,
  limit: mockLimit
});
const mockFrom = jest.fn().mockReturnValue({ 
  where: mockWhere,
  orderBy: mockOrderBy
});
const mockSelect = jest.fn().mockReturnValue({ 
  from: mockFrom,
  orderBy: mockOrderBy
});

// Mock database connection to prevent real database access
jest.mock('./database', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  },
  sql: jest.fn(() => Promise.resolve([{ testValue: 1 }])),
  closeDatabase: jest.fn(() => Promise.resolve()),
}));

jest.mock('./database/index', () => ({
  db: {
    insert: mockInsert,
    select: mockSelect,
  },
  sql: jest.fn(() => Promise.resolve([{ testValue: 1 }])),
  closeDatabase: jest.fn(() => Promise.resolve()),
}));


// Mock Drizzle ORM functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockImplementation((field, value) => ({ field, value, type: 'eq' })),
  desc: jest.fn().mockImplementation((field) => ({ field, type: 'desc' })),
  and: jest.fn().mockImplementation((...conditions) => ({ conditions, type: 'and' })),
}));


// Mock env configuration
jest.mock('@t3-oss/env-nextjs', () => ({
  createEnv: jest.fn(() => ({
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    BETTER_AUTH_SECRET: 'mock-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    RESEND_API_KEY: 'mock-resend-key',
    AWS_S3_BUCKET: 'mock-bucket',
    AWS_S3_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'mock-access-key',
    AWS_SECRET_ACCESS_KEY: 'mock-secret-key',
    CLOUDFLARE_R2_ENDPOINT: 'mock-endpoint',
    CLOUDFLARE_R2_ACCESS_KEY_ID: 'mock-r2-key',
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: 'mock-r2-secret',
    CREEM_API_KEY: 'mock-creem-api-key',
    CREEM_SECRET_KEY: 'mock-creem-secret',
    CREEM_WEBHOOK_SECRET: 'mock-webhook-secret',
    DB_POOL_SIZE: 20,
    DB_IDLE_TIMEOUT: 300,
    DB_MAX_LIFETIME: 14400,
    DB_CONNECT_TIMEOUT: 30,
  })),
}));

// Mock next-safe-action to avoid ES module issues
jest.mock('next-safe-action', () => ({
  createSafeActionClient: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    outputSchema: jest.fn().mockReturnThis(),
    action: jest.fn().mockReturnThis(),
    metadata: jest.fn().mockReturnThis(),
  })),
  DEFAULT_SERVER_ERROR_MESSAGE: 'Something went wrong',
}));

// Mock the env.js file
jest.mock('./env.js', () => ({
  __esModule: true,
  default: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    BETTER_AUTH_SECRET: 'mock-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    RESEND_API_KEY: 'mock-resend-key',
    R2_ENDPOINT: 'https://mock-endpoint.r2.cloudflarestorage.com',
    R2_ACCESS_KEY_ID: 'mock-access-key',
    R2_SECRET_ACCESS_KEY: 'mock-secret-key',
    R2_BUCKET_NAME: 'mock-bucket',
    R2_PUBLIC_URL: 'https://mock-public-url.com',
    CREEM_API_KEY: 'mock-creem-api-key',
    CREEM_ENVIRONMENT: 'test_mode',
    CREEM_WEBHOOK_SECRET: 'mock-webhook-secret',
    DB_POOL_SIZE: 20,
    DB_IDLE_TIMEOUT: 300,
    DB_MAX_LIFETIME: 14400,
    DB_CONNECT_TIMEOUT: 30,
  },
}));
