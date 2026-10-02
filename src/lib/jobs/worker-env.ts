import { z } from "zod";

import {
  databaseEnvFields,
  modelEnvFields,
} from "@/lib/config/runtime-env.mjs";

const workerEnvSchema = z.object({
  ...databaseEnvFields(5),
  R2_ENDPOINT: z.url().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
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
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  LLM_API_KEY: z.string().trim().min(1).optional(),
  ...modelEnvFields,
});

export function loadWorkerEnv(
  source: NodeJS.ProcessEnv = process.env,
  options: { aiEnabled?: boolean } = {},
) {
  const parsed = workerEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid worker environment: ${z.prettifyError(parsed.error)}`,
    );
  }

  if (
    options.aiEnabled &&
    (!parsed.data.BETTER_AUTH_SECRET || !parsed.data.LLM_API_KEY)
  ) {
    throw new Error(
      "AI Worker requires BETTER_AUTH_SECRET and LLM_API_KEY while the AI feature is enabled.",
    );
  }
  return {
    ...parsed.data,
    JOB_DATABASE_URL: parsed.data.JOB_DATABASE_URL ?? parsed.data.DATABASE_URL,
  };
}
