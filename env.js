import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { validateIntegrationEnv } from "./src/lib/config/integration-env.mjs";
import { SITE_CONFIG } from "./src/lib/config/site.js";

const appOriginSchema = z
  .string()
  .url()
  .transform((value, context) => {
    const url = new URL(value);
    if (
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    ) {
      context.addIssue({
        code: "custom",
        message:
          "NEXT_PUBLIC_APP_URL must be a URL origin without path, query, or hash",
      });
      return z.NEVER;
    }

    return url.origin;
  });

const databaseUrlSchema = z
  .string()
  .url()
  .refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "DATABASE_URL must use the postgres or postgresql protocol",
  );

const optionalCredentialSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .min(1)
    .refine((value) => value.toLowerCase() !== "optional", {
      message:
        'Remove optional credentials instead of setting them to "optional"',
    })
    .optional(),
);

const env = createEnv({
  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",

  // Server-side environment variables
  server: {
    // Database URL
    DATABASE_URL: databaseUrlSchema,

    // Database connection pool settings
    DB_POOL_SIZE: z.coerce.number().int().positive().default(20),
    DB_IDLE_TIMEOUT: z.coerce.number().int().nonnegative().default(300),
    DB_MAX_LIFETIME: z.coerce.number().int().nonnegative().default(14400),
    DB_CONNECT_TIMEOUT: z.coerce.number().int().positive().max(4).default(4),
    RATE_LIMIT_IP_HEADER: z
      .enum([
        "cf-connecting-ip",
        "x-vercel-forwarded-for",
        "x-real-ip",
        "x-forwarded-for",
      ])
      .default("x-forwarded-for"),
    BING_SITE_VERIFICATION: optionalCredentialSchema,

    // Authentication credentials
    GOOGLE_CLIENT_ID: optionalCredentialSchema,
    GOOGLE_CLIENT_SECRET: optionalCredentialSchema,
    GITHUB_CLIENT_ID: optionalCredentialSchema,
    GITHUB_CLIENT_SECRET: optionalCredentialSchema,
    LINKEDIN_CLIENT_ID: optionalCredentialSchema,
    LINKEDIN_CLIENT_SECRET: optionalCredentialSchema,
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters")
      .refine(
        (value) => value !== "replace-with-at-least-32-random-characters",
        "BETTER_AUTH_SECRET must not use the example placeholder",
      ),

    // API keys
    RESEND_API_KEY: optionalCredentialSchema,
    RESEND_EMAIL_FROM: z.string().email().optional(),

    // Cloudflare R2 Storage
    R2_ENDPOINT: z.string().url().optional(),
    R2_ACCESS_KEY_ID: optionalCredentialSchema,
    R2_SECRET_ACCESS_KEY: optionalCredentialSchema,
    R2_BUCKET_NAME: optionalCredentialSchema,
    R2_PUBLIC_URL: z.string().url().optional(),
    UPLOAD_CLEANUP_SECRET: z
      .string()
      .min(32, "UPLOAD_CLEANUP_SECRET must be at least 32 characters")
      .refine(
        (value) => value !== "replace-with-at-least-32-random-characters",
        "UPLOAD_CLEANUP_SECRET must not use the example placeholder",
      )
      .optional(),
    UPLOAD_DAILY_QUOTA_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(1024 * 1024 * 1024),
    UPLOAD_TOTAL_QUOTA_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024 * 1024),
    UPLOAD_LEGACY_COMPLETION_SINCE: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.iso.datetime().optional(),
    ),
    UPLOAD_LEGACY_COMPLETION_UNTIL: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.iso.datetime().optional(),
    ),

    // Payments
    STRIPE_SECRET_KEY: optionalCredentialSchema,
    STRIPE_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
    STRIPE_WEBHOOK_SECRET: optionalCredentialSchema,

    // E2E testing
    E2E_DATABASE_URL: databaseUrlSchema.optional(),
    E2E_TEST_MODE: z.enum(["true", "false"]).optional(),
    E2E_TEST_SECRET: z.string().optional(),
  },

  // Client-side public environment variables
  client: {
    // Application settings
    NEXT_PUBLIC_APP_URL: appOriginSchema,
    NEXT_PUBLIC_UMAMI_SCRIPT_URL: z.url().optional(),
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: z.uuid().optional(),
    NEXT_PUBLIC_UMAMI_DOMAINS: z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) =>
          value.split(",").every((domain) => {
            const normalizedDomain = domain.trim();
            return (
              normalizedDomain.length > 0 &&
              !normalizedDomain.includes("://") &&
              !normalizedDomain.includes("/")
            );
          }),
        "NEXT_PUBLIC_UMAMI_DOMAINS must be a comma-separated hostname list",
      )
      .optional(),
  },

  // Linking runtime environment variables
  runtimeEnv: {
    // Database URL
    DATABASE_URL: process.env.DATABASE_URL,

    // Database connection pool settings
    DB_POOL_SIZE: process.env.DB_POOL_SIZE,
    DB_IDLE_TIMEOUT: process.env.DB_IDLE_TIMEOUT,
    DB_MAX_LIFETIME: process.env.DB_MAX_LIFETIME,
    DB_CONNECT_TIMEOUT: process.env.DB_CONNECT_TIMEOUT,
    RATE_LIMIT_IP_HEADER: process.env.RATE_LIMIT_IP_HEADER,
    BING_SITE_VERIFICATION: process.env.BING_SITE_VERIFICATION,

    // Authentication credentials
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
    LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,

    // API keys
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_EMAIL_FROM: process.env.RESEND_EMAIL_FROM,

    // Cloudflare R2 Storage
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
    UPLOAD_CLEANUP_SECRET: process.env.UPLOAD_CLEANUP_SECRET,
    UPLOAD_DAILY_QUOTA_BYTES: process.env.UPLOAD_DAILY_QUOTA_BYTES,
    UPLOAD_TOTAL_QUOTA_BYTES: process.env.UPLOAD_TOTAL_QUOTA_BYTES,
    UPLOAD_LEGACY_COMPLETION_SINCE: process.env.UPLOAD_LEGACY_COMPLETION_SINCE,
    UPLOAD_LEGACY_COMPLETION_UNTIL: process.env.UPLOAD_LEGACY_COMPLETION_UNTIL,

    // Application settings
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_UMAMI_SCRIPT_URL: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
    NEXT_PUBLIC_UMAMI_WEBSITE_ID: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
    NEXT_PUBLIC_UMAMI_DOMAINS: process.env.NEXT_PUBLIC_UMAMI_DOMAINS,
    // Payments
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_ENVIRONMENT: process.env.STRIPE_ENVIRONMENT,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    // E2E testing
    E2E_DATABASE_URL: process.env.E2E_DATABASE_URL,
    E2E_TEST_MODE: process.env.E2E_TEST_MODE,
    E2E_TEST_SECRET: process.env.E2E_TEST_SECRET,
  },
});

const umamiConfiguration = [
  env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
  env.NEXT_PUBLIC_UMAMI_DOMAINS,
];

if (
  process.env.SKIP_ENV_VALIDATION !== "1" &&
  umamiConfiguration.some(Boolean) &&
  !umamiConfiguration.every(Boolean)
) {
  throw new Error(
    "Umami analytics requires NEXT_PUBLIC_UMAMI_SCRIPT_URL, NEXT_PUBLIC_UMAMI_WEBSITE_ID, and NEXT_PUBLIC_UMAMI_DOMAINS together.",
  );
}

if (process.env.SKIP_ENV_VALIDATION !== "1") {
  validateIntegrationEnv(SITE_CONFIG.features, env);
}

export default env;
