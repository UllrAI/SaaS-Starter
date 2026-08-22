import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { AppDatabase } from "@/database/client";
import type { JobDefinition } from "@/lib/jobs/definition";
import type { JobQueue } from "@/lib/jobs/queue";
import { cancelTaskRun, createTaskRun, getOwnedTaskRun } from "./repository";
import type { TaskRun } from "./types";

export async function createBackgroundTask<
  Name extends string,
  Schema extends z.ZodType,
  Result,
>(input: {
  db: AppDatabase;
  queue: JobQueue;
  definition: JobDefinition<Name, Schema, Result>;
  scopeKey: string;
  payload: z.infer<Schema>;
  idempotencyKey?: string;
}): Promise<{ taskRun: TaskRun; created: boolean }> {
  const created = await createTaskRun(input.db, {
    kind: input.definition.name,
    scopeKey: input.scopeKey,
    idempotencyKey: input.idempotencyKey,
    input: input.payload,
  });

  if (created.taskRun.status === "queued") {
    await input.queue.enqueue(input.definition, {
      taskRunId: created.taskRun.id,
      scopeKey: input.scopeKey,
      payload: input.payload,
    });
  }

  return created;
}

export async function cancelOwnedBackgroundTask(input: {
  db: AppDatabase;
  queue: JobQueue;
  taskRunId: string;
  scopeKey: string;
}): Promise<TaskRun | null> {
  const owned = await getOwnedTaskRun(
    input.db,
    input.taskRunId,
    input.scopeKey,
  );
  if (!owned) return null;

  const cancelled = await cancelTaskRun(input.db, input.taskRunId);
  if (!cancelled) return owned;

  try {
    await input.queue.cancel(owned.kind, owned.id);
  } catch (error) {
    console.error(
      JSON.stringify({
        component: "task-api",
        event: "queue_cancel_failed",
        taskRunId: owned.id,
        jobName: owned.kind,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
  }

  return cancelled;
}

export async function enqueueBackgroundTaskContinuation<
  Name extends string,
  Schema extends z.ZodType,
  Result,
>(input: {
  db: AppDatabase;
  queue: JobQueue;
  definition: JobDefinition<Name, Schema, Result>;
  taskRunId: string;
  scopeKey: string;
  payload: z.infer<Schema>;
  startAfter?: Date | number;
  continuationJobId?: string;
}): Promise<boolean> {
  const taskRun = await getOwnedTaskRun(
    input.db,
    input.taskRunId,
    input.scopeKey,
  );
  if (
    !taskRun ||
    taskRun.kind !== input.definition.name ||
    taskRun.status !== "waiting"
  ) {
    return false;
  }

  await input.queue.enqueue(
    input.definition,
    {
      taskRunId: input.taskRunId,
      scopeKey: input.scopeKey,
      payload: input.payload,
    },
    {
      jobId: input.continuationJobId ?? randomUUID(),
      startAfter: input.startAfter,
    },
  );
  return true;
}
