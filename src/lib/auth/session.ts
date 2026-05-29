import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/config/roles";

export const E2E_AUTH_COOKIE_NAME = "__e2e_auth_session";
const E2E_SESSION_MAX_AGE_SECONDS = 60 * 60;
const E2E_TEST_SECRET_MIN_LENGTH = 32;
const BLOCKED_E2E_TEST_SECRETS = new Set(["local-e2e-secret"]);
const E2E_TEST_ROLES = new Set<UserRole>(["user", "admin", "super_admin"]);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

function isLocalAppUrl(): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return false;
  }

  try {
    const { hostname } = new URL(appUrl);
    return (
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    );
  } catch {
    return false;
  }
}

function isProductionDeployment(): boolean {
  if (process.env.VERCEL_ENV === "production") {
    return true;
  }

  return process.env.NODE_ENV === "production" && !isLocalAppUrl();
}

export function getE2ETestSecret(): string | null {
  const secret = process.env.E2E_TEST_SECRET?.trim();
  if (!secret) {
    return null;
  }

  if (
    secret.length < E2E_TEST_SECRET_MIN_LENGTH ||
    BLOCKED_E2E_TEST_SECRETS.has(secret)
  ) {
    return null;
  }

  return secret;
}

function isE2ETestModeEnabled(): boolean {
  return (
    process.env.E2E_TEST_MODE === "true" &&
    !isProductionDeployment() &&
    getE2ETestSecret() !== null
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlEncodeText(value: string): string {
  return base64UrlEncode(textEncoder.encode(value));
}

function base64UrlDecodeText(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );
    return textDecoder.decode(bytes);
  } catch {
    return null;
  }
}

async function signE2EPayload(
  payload: string,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(payload),
  );

  return base64UrlEncode(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}

async function hasValidE2ESignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expectedSignature = await signE2EPayload(payload, secret);
  return constantTimeEqual(signature, expectedSignature);
}

function isE2ETestUser(value: unknown): value is E2ETestUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<Record<keyof E2ETestUser, unknown>>;
  const image = user.image;

  return (
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.email === "string" &&
    user.email.length > 0 &&
    typeof user.name === "string" &&
    user.name.length > 0 &&
    typeof user.role === "string" &&
    E2E_TEST_ROLES.has(user.role as UserRole) &&
    (image === undefined || image === null || typeof image === "string")
  );
}

export async function createE2ESessionCookieValue(
  user: E2ETestUser,
): Promise<string | null> {
  const secret = getE2ETestSecret();
  if (!secret) {
    return null;
  }

  const payload = base64UrlEncodeText(JSON.stringify(user));
  const signature = await signE2EPayload(payload, secret);
  return `${payload}.${signature}`;
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

export async function getE2ETestUserFromHeaders(
  headers: Headers,
): Promise<E2ETestUser | null> {
  if (!isE2ETestModeEnabled()) {
    return null;
  }

  const secret = getE2ETestSecret();
  if (!secret) {
    return null;
  }

  const cookieValue = parseCookieHeader(headers.get("cookie")).get(
    E2E_AUTH_COOKIE_NAME,
  );
  if (!cookieValue) {
    return null;
  }

  const [payload, signature, extra] = cookieValue.split(".");
  if (!payload || !signature || extra !== undefined) {
    return null;
  }

  if (!(await hasValidE2ESignature(payload, signature, secret))) {
    return null;
  }

  const decodedPayload = base64UrlDecodeText(payload);
  if (!decodedPayload) {
    return null;
  }

  try {
    const parsedPayload = JSON.parse(decodedPayload);
    return isE2ETestUser(parsedPayload) ? parsedPayload : null;
  } catch {
    return null;
  }
}

function createE2ESession(user: E2ETestUser): AppSession {
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + E2E_SESSION_MAX_AGE_SECONDS * 1000,
  );

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
  const e2eUser = await getE2ETestUserFromHeaders(headers);
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

  return (await getE2ETestUserFromHeaders(request.headers)) !== null;
}

export function shouldAllowE2ETestAccess(secret: string | null): boolean {
  const expectedSecret = getE2ETestSecret();
  return (
    isE2ETestModeEnabled() &&
    secret !== null &&
    expectedSecret !== null &&
    constantTimeEqual(secret, expectedSecret)
  );
}
