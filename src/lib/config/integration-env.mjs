// @ts-check

/**
 * @param {string} integration
 * @param {Record<string, unknown>} values
 * @param {string[]} keys
 */
function requireIntegrationValues(integration, values, keys) {
  const missing = keys.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(
      `${integration} is enabled but missing: ${missing.join(", ")}.`,
    );
  }
}

/**
 * Validates relationships that cannot be expressed by individual env schemas.
 *
 * @param {{emailAuth: boolean, billing: boolean, uploads: boolean}} features
 * @param {Record<string, unknown>} values
 */
export function validateIntegrationEnv(features, values) {
  const oauthPairs = [
    ["Google", values.GOOGLE_CLIENT_ID, values.GOOGLE_CLIENT_SECRET],
    ["GitHub", values.GITHUB_CLIENT_ID, values.GITHUB_CLIENT_SECRET],
    ["LinkedIn", values.LINKEDIN_CLIENT_ID, values.LINKEDIN_CLIENT_SECRET],
  ];

  for (const [provider, clientId, clientSecret] of oauthPairs) {
    if (Boolean(clientId) !== Boolean(clientSecret)) {
      throw new Error(
        `${provider} OAuth requires both its client ID and client secret.`,
      );
    }
  }

  if (features.emailAuth) {
    requireIntegrationValues("Email authentication", values, [
      "RESEND_API_KEY",
      "RESEND_EMAIL_FROM",
    ]);
  } else if (
    !oauthPairs.some(([, clientId, clientSecret]) => clientId && clientSecret)
  ) {
    throw new Error(
      "Email authentication is disabled, so at least one complete OAuth provider must be configured.",
    );
  }

  if (features.billing) {
    requireIntegrationValues("Billing", values, [
      "CREEM_API_KEY",
      "CREEM_WEBHOOK_SECRET",
    ]);

    const apiKey = String(values.CREEM_API_KEY);
    const environment = values.CREEM_ENVIRONMENT;
    const isTestKey = apiKey.startsWith("creem_test_");
    const hasCreemPrefix = apiKey.startsWith("creem_");
    if (
      (environment === "test_mode" && !isTestKey) ||
      (environment === "live_mode" && (!hasCreemPrefix || isTestKey))
    ) {
      throw new Error(
        `CREEM_API_KEY does not match CREEM_ENVIRONMENT=${environment}.`,
      );
    }
  }

  if (features.uploads) {
    requireIntegrationValues("Uploads", values, [
      "R2_ENDPOINT",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_URL",
      "UPLOAD_CLEANUP_SECRET",
    ]);
  }

  const legacySince = values.UPLOAD_LEGACY_COMPLETION_SINCE;
  const legacyUntil = values.UPLOAD_LEGACY_COMPLETION_UNTIL;
  if (Boolean(legacySince) !== Boolean(legacyUntil)) {
    throw new Error(
      "Legacy upload compatibility requires both UPLOAD_LEGACY_COMPLETION_SINCE and UPLOAD_LEGACY_COMPLETION_UNTIL.",
    );
  }
  if (typeof legacySince === "string" && typeof legacyUntil === "string") {
    const compatibilityDuration =
      Date.parse(legacyUntil) - Date.parse(legacySince);
    if (
      compatibilityDuration <= 0 ||
      compatibilityDuration > 24 * 60 * 60 * 1000
    ) {
      throw new Error(
        "The legacy upload compatibility window must be longer than zero and no more than 24 hours.",
      );
    }
  }
}
