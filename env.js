import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
    DATABASE_URL: z.string().url({ message: "Invalid database URL" }),

    // Database connection pool settings
    DB_POOL_SIZE: z.coerce.number().default(20),
    DB_IDLE_TIMEOUT: z.coerce.number().default(300),
    DB_MAX_LIFETIME: z.coerce.number().default(14400),
    DB_CONNECT_TIMEOUT: z.coerce.number().default(30),
    RATE_LIMIT_IP_HEADER: z.enum([
      "cf-connecting-ip",
      "x-vercel-forwarded-for",
      "x-real-ip",
      "x-forwarded-for",
    ]),

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
    RESEND_API_KEY: z.string(),
    RESEND_EMAIL_FROM: z.string().email(),

    // Cloudflare R2 Storage
    R2_ENDPOINT: z.string().url(),
    R2_ACCESS_KEY_ID: z.string(),
    R2_SECRET_ACCESS_KEY: z.string(),
    R2_BUCKET_NAME: z.string(),
    R2_PUBLIC_URL: z.string().url(),

    // Payments
    CREEM_API_KEY: z.string(),
    CREEM_ENVIRONMENT: z.enum(["test_mode", "live_mode"]).default("test_mode"),
    CREEM_WEBHOOK_SECRET: z.string(),

    // E2E testing
    E2E_TEST_MODE: z.enum(["true", "false"]).optional(),
    E2E_TEST_SECRET: z.string().optional(),
  },

  // Client-side public environment variables
  client: {
    // Application settings
    NEXT_PUBLIC_APP_URL: appOriginSchema,
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

    // Application settings
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    // Payments
    CREEM_API_KEY: process.env.CREEM_API_KEY,
    CREEM_ENVIRONMENT: process.env.CREEM_ENVIRONMENT,
    CREEM_WEBHOOK_SECRET: process.env.CREEM_WEBHOOK_SECRET,

    // E2E testing
    E2E_TEST_MODE: process.env.E2E_TEST_MODE,
    E2E_TEST_SECRET: process.env.E2E_TEST_SECRET,
  },
});

if (process.env.SKIP_ENV_VALIDATION !== "1") {
  const oauthPairs = [
    ["Google", env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET],
    ["GitHub", env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET],
    ["LinkedIn", env.LINKEDIN_CLIENT_ID, env.LINKEDIN_CLIENT_SECRET],
  ];

  for (const [provider, clientId, clientSecret] of oauthPairs) {
    if (Boolean(clientId) !== Boolean(clientSecret)) {
      throw new Error(
        `${provider} OAuth requires both its client ID and client secret.`,
      );
    }
  }
}

export default env;
