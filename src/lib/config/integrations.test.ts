import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const env = {
  RESEND_API_KEY: "resend-key",
  RESEND_EMAIL_FROM: "noreply@example.com",
  CREEM_API_KEY: "creem_test_key",
  CREEM_ENVIRONMENT: "test_mode",
  CREEM_WEBHOOK_SECRET: "webhook-secret",
  R2_ENDPOINT: "https://r2.example.com",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_BUCKET_NAME: "bucket",
  R2_PUBLIC_URL: "https://cdn.example.com",
  UPLOAD_CLEANUP_SECRET: "cleanup-secret",
};

jest.mock("@/env", () => ({ __esModule: true, default: env }));

describe("integration configuration accessors", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns typed configuration for enabled integrations", async () => {
    const {
      getBillingConfig,
      getEmailConfig,
      getUploadCleanupSecret,
      getUploadConfig,
    } = await import("./integrations");

    expect(getEmailConfig()).toEqual({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_EMAIL_FROM,
    });
    expect(getBillingConfig()).toEqual({
      apiKey: env.CREEM_API_KEY,
      environment: env.CREEM_ENVIRONMENT,
      webhookSecret: env.CREEM_WEBHOOK_SECRET,
    });
    expect(getUploadConfig().bucketName).toBe(env.R2_BUCKET_NAME);
    expect(getUploadCleanupSecret()).toBe(env.UPLOAD_CLEANUP_SECRET);
  });

  it("fails before reading credentials for a disabled integration", async () => {
    jest.doMock("@/lib/config/site", () => ({
      SITE_CONFIG: {
        features: { emailAuth: false, billing: false, uploads: false },
      },
    }));
    const { getBillingConfig, IntegrationDisabledError } =
      await import("./integrations");

    expect(getBillingConfig).toThrow(IntegrationDisabledError);
  });
});
