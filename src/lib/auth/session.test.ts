import { webcrypto } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import {
  createE2ESessionCookieValue,
  E2E_AUTH_COOKIE_NAME,
  getE2ETestSecret,
  getE2ETestUserFromHeaders,
  shouldAllowE2ETestAccess,
  type E2ETestUser,
} from "./session";

const VALID_SECRET =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const originalEnv = {
  E2E_TEST_MODE: process.env.E2E_TEST_MODE,
  E2E_TEST_SECRET: process.env.E2E_TEST_SECRET,
  PLAYWRIGHT: process.env.PLAYWRIGHT,
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

describe("E2E auth session helpers", () => {
  const user: E2ETestUser = {
    id: "e2e-user",
    email: "user@e2e.local",
    name: "E2E User",
    role: "user",
  };

  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: webcrypto,
      configurable: true,
    });
  });

  beforeEach(() => {
    process.env.E2E_TEST_MODE = "true";
    process.env.E2E_TEST_SECRET = VALID_SECRET;
    process.env.PLAYWRIGHT = "true";
    process.env.NEXT_PUBLIC_APP_URL = "http://127.0.0.1:3100";
    delete process.env.VERCEL_ENV;
    setNodeEnv("test");
  });

  afterEach(() => {
    restoreEnvValue("E2E_TEST_MODE");
    restoreEnvValue("E2E_TEST_SECRET");
    restoreEnvValue("PLAYWRIGHT");
    restoreEnvValue("NEXT_PUBLIC_APP_URL");
    restoreEnvValue("VERCEL_ENV");
    if (originalEnv.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      setNodeEnv(originalEnv.NODE_ENV);
    }
  });

  it("rejects E2E access when the secret is missing", () => {
    delete process.env.E2E_TEST_SECRET;

    expect(getE2ETestSecret()).toBeNull();
    expect(shouldAllowE2ETestAccess(VALID_SECRET)).toBe(false);
  });

  it("rejects the previous shared default secret", () => {
    process.env.E2E_TEST_SECRET = "local-e2e-secret";

    expect(getE2ETestSecret()).toBeNull();
    expect(shouldAllowE2ETestAccess("local-e2e-secret")).toBe(false);
  });

  it("rejects E2E access for non-local production deployments", () => {
    setNodeEnv("production");
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

    expect(shouldAllowE2ETestAccess(VALID_SECRET)).toBe(false);
  });

  it("rejects E2E access outside Playwright", () => {
    delete process.env.PLAYWRIGHT;

    expect(shouldAllowE2ETestAccess(VALID_SECRET)).toBe(false);
  });

  it("allows E2E access with a valid explicit secret in local test mode", () => {
    expect(getE2ETestSecret()).toBe(VALID_SECRET);
    expect(shouldAllowE2ETestAccess(VALID_SECRET)).toBe(true);
  });

  it("signs and verifies the E2E session cookie", async () => {
    const cookieValue = await createE2ESessionCookieValue(user);

    expect(cookieValue).toEqual(expect.stringContaining("."));
    await expect(
      getE2ETestUserFromHeaders(
        new Headers({
          cookie: `${E2E_AUTH_COOKIE_NAME}=${cookieValue}`,
        }),
      ),
    ).resolves.toEqual(user);
  });

  it("rejects tampered E2E session cookies", async () => {
    const cookieValue = await createE2ESessionCookieValue(user);
    const tamperedCookieValue = cookieValue?.replace(/.$/, "x");

    await expect(
      getE2ETestUserFromHeaders(
        new Headers({
          cookie: `${E2E_AUTH_COOKIE_NAME}=${tamperedCookieValue}`,
        }),
      ),
    ).resolves.toBeNull();
  });
});
