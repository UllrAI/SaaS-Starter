export const DEFAULT_CALLBACK_URL = "/dashboard";

/**
 * Keep auth callback targets on-site and path-only to avoid open redirects.
 */
export function normalizeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback: string = DEFAULT_CALLBACK_URL,
): string {
  if (!callbackUrl) {
    return fallback;
  }

  const trimmed = callbackUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  // Only allow app-internal absolute paths.
  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return fallback;
  }

  // Block slash-backslash pattern that some browsers treat as external host.
  if (decoded.startsWith("/\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(decoded, "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginRedirectPath(
  callbackUrl: string | null | undefined,
  authError?: string,
): string {
  const safeCallback = normalizeCallbackUrl(callbackUrl);
  const searchParams = new URLSearchParams({
    callbackUrl: safeCallback,
  });

  if (authError) {
    searchParams.set("authError", authError);
  }

  return `/login?${searchParams.toString()}`;
}
