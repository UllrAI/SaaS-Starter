import { z } from "zod";

export const databaseUrlSchema = z
  .url()
  .refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "DATABASE_URL must use the postgres or postgresql protocol",
  );

// Web and Worker choose their pool defaults, but share validation and timing.
export function databaseEnvFields(poolSize) {
  return {
    DATABASE_URL: databaseUrlSchema,
    JOB_DATABASE_URL: z.preprocess(
      (value) => value || undefined,
      databaseUrlSchema.optional(),
    ),
    DB_POOL_SIZE: z.coerce.number().int().positive().max(50).default(poolSize),
    DB_IDLE_TIMEOUT: z.coerce.number().int().nonnegative().default(300),
    DB_MAX_LIFETIME: z.coerce.number().int().nonnegative().default(14_400),
    DB_CONNECT_TIMEOUT: z.coerce.number().int().positive().max(4).default(4),
    JOB_DB_POOL_SIZE: z.coerce.number().int().positive().max(20).default(3),
    WORKER_GRACEFUL_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000),
  };
}

export const modelEnvFields = {
  LLM_BASE_URL: z.url().default("https://api.openai.com/v1"),
  AI_DEFAULT_MODEL: z.string().trim().min(1).default("gpt-5.6-luna"),
};
