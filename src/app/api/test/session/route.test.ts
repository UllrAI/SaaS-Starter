import { webcrypto } from "node:crypto";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { NextRequest } from "next/server";
import {
  E2E_AUTH_COOKIE_NAME,
  getE2ETestUserFromHeaders,
} from "@/lib/auth/session";

const VALID_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TEST_USER = {
  id: "e2e-user",
  email: "user@e2e.local",
  name: "E2E User",
  role: "user",
};

const mockCookieSet = jest.fn();
const mockJson = jest.fn((data: unknown, init: { status?: number } = {}) => ({
  status: init.status ?? 200,
  ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
  json: () => Promise.resolve(data),
  cookies: {
    set: mockCookieSet,
  },
}));

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: mockJson,
  },
}));

const mockLimit = jest.fn();
const mockWhere = jest.fn(() => ({
  limit: mockLimit,
}));
const mockFrom = jest.fn(() => ({
  where: mockWhere,
}));
const mockSelect = jest.fn(() => ({
  from: mockFrom,
}));
const mockOnConflictDoUpdate = jest.fn();
const mockValues = jest.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = jest.fn(() => ({
  values: mockValues,
}));
const mockDeleteWhere = jest.fn();
const mockDelete = jest.fn(() => ({
  where: mockDeleteWhere,
}));

jest.mock("@/database", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
  },
}));

jest.mock("@/database/schema", () => ({
  users: {
    id: "users.id",
    email: "users.email",
  },
}));

const mockEq = jest.fn();
jest.mock("drizzle-orm", () => ({
  eq: mockEq,
}));

const originalEnv = {
  E2E_TEST_MODE: process.env.E2E_TEST_MODE,
  E2E_TEST_SECRET: process.env.E2E_TEST_SECRET,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

function setNodeEnv(value: string): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
    writable: true,
  });
}

function restoreEnvValue(key: keyof typeof originalEnv): void {
  const value = originalEnv[key];
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

function createPostRequest(secret: string | null): NextRequest {
  const headers = new Headers();
  if (secret !== null) {
    headers.set("x-e2e-test-secret", secret);
  }

  return {
    headers,
    json: jest.fn().mockResolvedValue(TEST_USER),
  } as unknown as NextRequest;
}

describe("POST /api/test/session", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = VALID_SECRET;
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3100";
    delete process.env.VERCEL_ENV;
    setNodeEnv("test");
    mockLimit.mockResolvedValue([]);
    mockOnConflictDoUpdate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    restoreEnvValue("E2E_TEST_MODE");
    restoreEnvValue("E2E_TEST_SECRET");
    restoreEnvValue("NEXT_PUBLIC_APP_URL");
    restoreEnvValue("VERCEL_ENV");
    if (originalEnv.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      setNodeEnv(originalEnv.NODE_ENV);
    }
  });

  it("returns 404 when the configured E2E secret is missing", async () => {
    delete process.env.E2E_TEST_SECRET;

    const { POST } = await import("./route");
    const response = await POST(createPostRequest(VALID_SECRET));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("returns 404 for non-local production deployments", async () => {
    setNodeEnv("production");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    const { POST } = await import("./route");
    const response = await POST(createPostRequest(VALID_SECRET));

    expect(response.status).toBe(404);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
  });

  it("creates a signed E2E session cookie with a valid explicit secret", async () => {
    const { POST } = await import("./route");
    const response = await POST(createPostRequest(VALID_SECRET));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true, userId: TEST_USER.id });
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockCookieSet).toHaveBeenCalledWith(
      expect.objectContaining({
        name: E2E_AUTH_COOKIE_NAME,
        httpOnly: true,
        sameSite: "lax",
        value: expect.stringContaining("."),
      }),
    );

    const cookieOptions = mockCookieSet.mock.calls[0]?.[0] as
      | { value?: string }
      | undefined;
    await expect(
      getE2ETestUserFromHeaders(
        new Headers({
          cookie: `${E2E_AUTH_COOKIE_NAME}=${cookieOptions?.value}`,
        }),
      ),
    ).resolves.toMatchObject(TEST_USER);
  });
});
