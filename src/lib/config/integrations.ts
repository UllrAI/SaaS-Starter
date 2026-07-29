import "server-only";

import env from "@/env";
import { SITE_CONFIG } from "@/lib/config/site";

export class IntegrationDisabledError extends Error {
  constructor(integration: "emailAuth" | "billing" | "uploads") {
    super(`The ${integration} integration is disabled.`);
    this.name = "IntegrationDisabledError";
  }
}

function requireValue(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required for the enabled integration.`);
  }
  return value;
}

export function getEmailConfig() {
  if (!SITE_CONFIG.features.emailAuth) {
    throw new IntegrationDisabledError("emailAuth");
  }

  return {
    apiKey: requireValue(env.RESEND_API_KEY, "RESEND_API_KEY"),
    from: requireValue(env.RESEND_EMAIL_FROM, "RESEND_EMAIL_FROM"),
  };
}

export function getBillingConfig() {
  if (!SITE_CONFIG.features.billing) {
    throw new IntegrationDisabledError("billing");
  }

  return {
    apiKey: requireValue(env.CREEM_API_KEY, "CREEM_API_KEY"),
    environment: env.CREEM_ENVIRONMENT,
    webhookSecret: requireValue(
      env.CREEM_WEBHOOK_SECRET,
      "CREEM_WEBHOOK_SECRET",
    ),
  };
}

export function getUploadConfig() {
  if (!SITE_CONFIG.features.uploads) {
    throw new IntegrationDisabledError("uploads");
  }

  return {
    endpoint: requireValue(env.R2_ENDPOINT, "R2_ENDPOINT"),
    accessKeyId: requireValue(env.R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID"),
    secretAccessKey: requireValue(
      env.R2_SECRET_ACCESS_KEY,
      "R2_SECRET_ACCESS_KEY",
    ),
    bucketName: requireValue(env.R2_BUCKET_NAME, "R2_BUCKET_NAME"),
    publicUrl: requireValue(env.R2_PUBLIC_URL, "R2_PUBLIC_URL"),
  };
}

export function getUploadCleanupSecret() {
  if (!SITE_CONFIG.features.uploads) {
    throw new IntegrationDisabledError("uploads");
  }
  return requireValue(env.UPLOAD_CLEANUP_SECRET, "UPLOAD_CLEANUP_SECRET");
}
