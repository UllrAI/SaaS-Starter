import { describe, expect, it } from "@jest/globals";
import {
  AUTH_BANNED_MESSAGE,
  resolveAuthFeedback,
  type AuthFeedbackKey,
} from "./feedback";

describe("resolveAuthFeedback", () => {
  it("prefers explicit auth feedback from the auth flow", () => {
    expect(
      resolveAuthFeedback({
        authError: "banned",
        banReason: "Chargeback fraud",
      }),
    ).toEqual({
      key: "banned",
      banReason: "Chargeback fraud",
    });

    expect(
      resolveAuthFeedback({
        authError: "session_expired",
      }),
    ).toEqual({
      key: "session_expired",
    });
  });

  it("maps banned states from generic error inputs", () => {
    expect(
      resolveAuthFeedback({
        errorDescription: AUTH_BANNED_MESSAGE,
        banReason: "Policy violation",
      }),
    ).toEqual({
      key: "banned",
      banReason: "Policy violation",
    });

    expect(
      resolveAuthFeedback({
        error: "BANNED_USER",
        banReason: "Repeated abuse",
      }),
    ).toEqual({
      key: "banned",
      banReason: "Repeated abuse",
    });
  });

  it.each<AuthFeedbackKey>([
    "INVALID_TOKEN",
    "EXPIRED_TOKEN",
    "ATTEMPTS_EXCEEDED",
    "please_restart_the_process",
    "sign_in_failed",
  ])("returns supported feedback keys directly for %s", (error) => {
    expect(resolveAuthFeedback({ error })).toEqual({ key: error });
  });

  it("normalizes unknown provider errors to a controlled fallback", () => {
    expect(
      resolveAuthFeedback({
        error: "unexpected_provider_error",
        errorDescription: "OAuth exploded",
      }),
    ).toEqual({
      key: "sign_in_failed",
    });
  });

  it("returns null when there is no allowlisted feedback to show", () => {
    expect(resolveAuthFeedback({})).toBeNull();
    expect(
      resolveAuthFeedback({
        error: "unexpected_provider_error",
      }),
    ).toBeNull();
  });
});
