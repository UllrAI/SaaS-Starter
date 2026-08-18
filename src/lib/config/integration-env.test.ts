import { describe, expect, it } from "@jest/globals";

import { validateIntegrationEnv } from "./integration-env.mjs";

const oauthEnv = {
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
  STRIPE_ENVIRONMENT: "test_mode",
};

describe("validateIntegrationEnv", () => {
  it("allows disabled optional integrations without their credentials", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: false, billing: false, uploads: false },
        oauthEnv,
      ),
    ).not.toThrow();
  });

  it("reports incomplete enabled integration groups", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: true, billing: false, uploads: false },
        { ...oauthEnv, RESEND_API_KEY: "resend-key" },
      ),
    ).toThrow(
      "Email authentication is enabled but missing: RESEND_EMAIL_FROM.",
    );

    expect(() =>
      validateIntegrationEnv(
        { emailAuth: false, billing: true, uploads: false },
        { ...oauthEnv, STRIPE_SECRET_KEY: "sk_test_key" },
      ),
    ).toThrow("Billing is enabled but missing: STRIPE_WEBHOOK_SECRET.");
  });

  it("accepts complete enabled integration groups", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: true, billing: true, uploads: true },
        {
          ...oauthEnv,
          RESEND_API_KEY: "resend-key",
          RESEND_EMAIL_FROM: "noreply@example.com",
          STRIPE_SECRET_KEY: "sk_test_key",
          STRIPE_WEBHOOK_SECRET: "whsec_webhook-secret",
          R2_ENDPOINT: "https://r2.example.com",
          R2_ACCESS_KEY_ID: "access-key",
          R2_SECRET_ACCESS_KEY: "secret-key",
          R2_BUCKET_NAME: "bucket",
          R2_PUBLIC_URL: "https://cdn.example.com",
          UPLOAD_CLEANUP_SECRET: "cleanup-secret",
        },
      ),
    ).not.toThrow();
  });

  it("rejects Stripe credentials for the wrong environment", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: false, billing: true, uploads: false },
        {
          ...oauthEnv,
          STRIPE_ENVIRONMENT: "live_mode",
          STRIPE_SECRET_KEY: "sk_test_key",
          STRIPE_WEBHOOK_SECRET: "whsec_secret",
        },
      ),
    ).toThrow("STRIPE_SECRET_KEY does not match STRIPE_ENVIRONMENT=live_mode.");
  });

  it("requires a Stripe endpoint signing secret", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: false, billing: true, uploads: false },
        {
          ...oauthEnv,
          STRIPE_SECRET_KEY: "sk_test_key",
          STRIPE_WEBHOOK_SECRET: "not-a-signing-secret",
        },
      ),
    ).toThrow("STRIPE_WEBHOOK_SECRET must start with whsec_.");
  });

  it("requires an OAuth provider when email authentication is disabled", () => {
    expect(() =>
      validateIntegrationEnv(
        { emailAuth: false, billing: false, uploads: false },
        {},
      ),
    ).toThrow("at least one complete OAuth provider");
  });
});
