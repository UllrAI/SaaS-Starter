import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/config/roles";

export const E2E_AUTH_COOKIE_NAME = "__e2e_auth_session";
const E2E_SESSION_MAX_AGE_SECONDS = 60 * 60;

export interface E2ETestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  image?: string | null;
}

interface AppSession {
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    image: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

function isE2ETestModeEnabled(): boolean {
  return process.env.E2E_TEST_MODE === "true";
}

export function getE2ETestSecret(): string {
  return process.env.E2E_TEST_SECRET || "local-e2e-secret";
}

export function createE2ESessionCookieValue(user: E2ETestUser): string {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(/;\s*/).forEach((part) => {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const name = part.slice(0, separatorIndex);
    const value = part.slice(separatorIndex + 1);
    cookies.set(name, decodeURIComponent(value));
  });

  return cookies;
}

export function getE2ETestUserFromHeaders(headers: Headers): E2ETestUser | null {
  if (!isE2ETestModeEnabled()) {
    return null;
  }

  const cookieValue = parseCookieHeader(headers.get("cookie")).get(
    E2E_AUTH_COOKIE_NAME,
  );
  if (!cookieValue) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(cookieValue, "base64url").toString("utf8"),
    ) as E2ETestUser;
  } catch {
    return null;
  }
}

function createE2ESession(user: E2ETestUser): AppSession {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + E2E_SESSION_MAX_AGE_SECONDS * 1000);

  return {
    session: {
      id: `e2e-session-${user.id}`,
      token: `e2e-session-${user.id}`,
      userId: user.id,
      expiresAt,
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: "playwright",
    },
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image ?? null,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  } as AppSession;
}

export async function getAuthSessionFromHeaders(
  headers: Headers,
): Promise<AppSession | null> {
  const e2eUser = getE2ETestUserFromHeaders(headers);
  if (e2eUser) {
    return createE2ESession(e2eUser);
  }

  const { auth } = await import("./server");
  return auth.api.getSession({
    headers,
    query: {
      disableCookieCache: true,
    },
  }) as Promise<AppSession | null>;
}

export async function hasAuthenticatedSession(
  request: NextRequest,
): Promise<boolean> {
  const { getSessionCookie } = await import("better-auth/cookies");

  if (getSessionCookie(request)) {
    return true;
  }

  if (!isE2ETestModeEnabled()) {
    return false;
  }

  return request.cookies.has(E2E_AUTH_COOKIE_NAME);
}

export function shouldAllowE2ETestAccess(secret: string | null): boolean {
  return isE2ETestModeEnabled() && secret === getE2ETestSecret();
}
