import { randomUUID } from "node:crypto";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { taskDispatches, taskRuns } from "@/database/schema";
import { scheduleTaskContinuation } from "./dispatch";
import type { z } from "zod";
import type { AppDatabase } from "@/database/client";
import type { JobDefinition } from "@/lib/jobs/definition";
import type { JobQueue } from "@/lib/jobs/queue";
import {
  cancelTaskRun,
  createTaskRun,
  getOwnedTaskRun,
  TaskCapacityError,
} from "./repository";
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
  const payload = input.definition.schema.parse(input.payload);
  const created = await input.db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${"tasks:" + input.scopeKey}, 0))`,
    );
    const result = await createTaskRun(tx, {
      kind: input.definition.name,
      scopeKey: input.scopeKey,
      idempotencyKey: input.idempotencyKey,
      input: payload,
    });
    if (result.created) {
      const [pending] = await tx
        .select({ count: count() })
        .from(taskRuns)
        .where(
          and(
            eq(taskRuns.scopeKey, input.scopeKey),
            inArray(taskRuns.status, ["queued", "running", "waiting"]),
          ),
        );
      if (pending.count > 100) throw new TaskCapacityError();
      const dispatchId = result.taskRun.id;
      await tx.insert(taskDispatches).values({
        id: dispatchId,
        taskRunId: result.taskRun.id,
        kind: input.definition.name,
        scopeKey: input.scopeKey,
        payload,
      });
      await tx
        .update(taskRuns)
        .set({ dispatchId })
        .where(eq(taskRuns.id, result.taskRun.id));
      result.taskRun.dispatchId = dispatchId;
    }
    return result;
  });
  // The transaction is the acceptance boundary. Worker dispatch recovers even
  // when the queue is unavailable or this Web process exits before delivery.
  await input.queue
    .dispatchPending(input.db, input.definition)
    .catch((error: unknown) => {
      console.error("Task accepted; queue delivery will retry:", error);
    });

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
    await input.queue.cancel(owned.kind, owned.dispatchId ?? owned.id);
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

  const scheduled = await scheduleTaskContinuation(input.db, {
    taskRunId: input.taskRunId,
    scopeKey: input.scopeKey,
    kind: input.definition.name,
    payload: input.definition.schema.parse(input.payload),
    dispatchId: input.continuationJobId ?? randomUUID(),
    startAfter: input.startAfter,
    from: "waiting",
  });
  if (scheduled)
    await input.queue
      .dispatchPending(input.db, input.definition)
      .catch(console.error);
  return scheduled;
}
