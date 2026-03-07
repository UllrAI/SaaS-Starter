import {
  DEFAULT_CALLBACK_URL,
  buildLoginRedirectPath,
  normalizeCallbackUrl,
} from "./callback-url";

describe("callback-url utils", () => {
  it("returns default callback when input is missing", () => {
    expect(normalizeCallbackUrl(undefined)).toBe(DEFAULT_CALLBACK_URL);
    expect(normalizeCallbackUrl("")).toBe(DEFAULT_CALLBACK_URL);
  });

  it("keeps valid internal paths including query and hash", () => {
    expect(normalizeCallbackUrl("/dashboard/billing?tab=history#invoices")).toBe(
      "/dashboard/billing?tab=history#invoices",
    );
  });

  it("normalizes encoded callback values", () => {
    expect(normalizeCallbackUrl("%2Fdashboard%2Fadmin%3Fpage%3Dusers")).toBe(
      "/dashboard/admin?page=users",
    );
  });

  it("rejects external redirects", () => {
    expect(normalizeCallbackUrl("https://evil.example/steal")).toBe(
      DEFAULT_CALLBACK_URL,
    );
    expect(normalizeCallbackUrl("//evil.example/steal")).toBe(
      DEFAULT_CALLBACK_URL,
    );
    expect(normalizeCallbackUrl("/\\evil.example/steal")).toBe(
      DEFAULT_CALLBACK_URL,
    );
  });

  it("builds login redirect path with encoded callback url", () => {
    expect(buildLoginRedirectPath("/dashboard/billing")).toBe(
      "/login?callbackUrl=%2Fdashboard%2Fbilling",
    );
  });

  it("includes auth error when provided", () => {
    expect(buildLoginRedirectPath("/dashboard", "session_expired")).toBe(
      "/login?callbackUrl=%2Fdashboard&authError=session_expired",
    );
  });
});
