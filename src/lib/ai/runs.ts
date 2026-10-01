import "server-only";
import { db } from "@/database";
import env from "@/env";
import * as repository from "./run-repository";
export { AiRunConflictError, AiBudgetExceededError } from "./run-repository";
export function beginAiRun(input: Parameters<typeof repository.beginAiRun>[2]) {
  return repository.beginAiRun(
    db,
    {
      tokenLimit: env.AI_DAILY_TOKEN_LIMIT,
      imageLimit: env.AI_DAILY_IMAGE_LIMIT,
    },
    input,
  );
}
export function completeAiRun(
  runId: string,
  response: Parameters<typeof repository.completeAiRun>[2],
  usage: Parameters<typeof repository.completeAiRun>[3],
) {
  return repository.completeAiRun(db, runId, response, usage);
}
export function failAiRun(runId: string, providerStarted: boolean) {
  return repository.failAiRun(db, runId, providerStarted);
}
