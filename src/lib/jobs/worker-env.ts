import { z } from "zod";

const databaseUrlSchema = z
  .url()
  .refine(
    (value) => ["postgres:", "postgresql:"].includes(new URL(value).protocol),
    "must use the postgres or postgresql protocol",
  );

const workerEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  JOB_DATABASE_URL: databaseUrlSchema.optional(),
  DB_POOL_SIZE: z.coerce.number().int().positive().max(50).default(5),
  DB_IDLE_TIMEOUT: z.coerce.number().int().nonnegative().default(300),
  DB_MAX_LIFETIME: z.coerce.number().int().nonnegative().default(14_400),
  DB_CONNECT_TIMEOUT: z.coerce.number().int().positive().max(10).default(4),
  JOB_DB_POOL_SIZE: z.coerce.number().int().positive().max(20).default(3),
  WORKER_GRACEFUL_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  LLM_API_KEY: z.string().trim().min(1).optional(),
  LLM_BASE_URL: z.url().default("https://api.openai.com/v1"),
  AI_DEFAULT_MODEL: z.string().trim().min(1).default("gpt-5.6-luna"),
});

export function loadWorkerEnv(source: NodeJS.ProcessEnv = process.env) {
  const parsed = workerEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid worker environment: ${z.prettifyError(parsed.error)}`,
    );
  }

  return {
    ...parsed.data,
    JOB_DATABASE_URL: parsed.data.JOB_DATABASE_URL ?? parsed.data.DATABASE_URL,
  };
}
