import "server-only";
import env from "@/env";
import { JobQueue } from "./queue";

export const serverJobQueue = new JobQueue({
  connectionString: env.JOB_DATABASE_URL ?? env.DATABASE_URL,
  poolSize: env.JOB_DB_POOL_SIZE,
});
