export const AUTH_BANNED_MESSAGE = "AUTH_BANNED";

export type AuthFeedbackKey =
  | "banned"
  | "session_expired"
  | "INVALID_TOKEN"
  | "EXPIRED_TOKEN"
  | "ATTEMPTS_EXCEEDED"
  | "please_restart_the_process"
  | "sign_in_failed";

export interface ResolvedAuthFeedback {
  key: AuthFeedbackKey;
  banReason?: string | null;
}

const AUTH_FEEDBACK_KEYS = new Set<AuthFeedbackKey>([
  "banned",
  "session_expired",
  "INVALID_TOKEN",
  "EXPIRED_TOKEN",
  "ATTEMPTS_EXCEEDED",
  "please_restart_the_process",
  "sign_in_failed",
]);

function isBannedAuthMessage(
  errorDescription: string | null | undefined,
): boolean {
  return errorDescription === AUTH_BANNED_MESSAGE;
}

export function resolveAuthFeedback({
  authError,
  error,
  errorDescription,
  banReason,
}: {
  authError?: string | null;
  error?: string | null;
  errorDescription?: string | null;
  banReason?: string | null;
}): ResolvedAuthFeedback | null {
  if (authError === "banned") {
    return { key: "banned", banReason };
  }

  if (authError === "session_expired") {
    return { key: "session_expired" };
  }

  if (!error) {
    return isBannedAuthMessage(errorDescription)
      ? { key: "banned", banReason }
      : null;
  }

  if (
    error === "banned" ||
    error === "BANNED_USER" ||
    isBannedAuthMessage(errorDescription)
  ) {
    return { key: "banned", banReason };
  }

  if (AUTH_FEEDBACK_KEYS.has(error as AuthFeedbackKey)) {
    return { key: error as AuthFeedbackKey };
  }

  if (errorDescription) {
    return { key: "sign_in_failed" };
  }

  return null;
}
