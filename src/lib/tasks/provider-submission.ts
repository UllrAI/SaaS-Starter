import type { AppDatabase } from "@/database/client";
import { getTaskRun, setProviderJobIdIfAbsent } from "./repository";

export async function ensureProviderJobSubmitted(input: {
  db: AppDatabase;
  taskRunId: string;
  submit: (input: { idempotencyKey: string }) => Promise<string>;
}): Promise<string> {
  const existingProviderJobId = (await getTaskRun(input.db, input.taskRunId))
    ?.providerJobId;
  if (existingProviderJobId) return existingProviderJobId;

  const submittedId = await input.submit({
    idempotencyKey: input.taskRunId,
  });
  const persistedId = await setProviderJobIdIfAbsent(
    input.db,
    input.taskRunId,
    submittedId,
  );
  if (!persistedId) {
    throw new Error(
      "Provider accepted the job but its id could not be persisted.",
    );
  }
  return persistedId;
}
