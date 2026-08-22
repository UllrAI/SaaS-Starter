import { and, eq, inArray, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { taskRuns } from "@/database/schema";
import type { TaskRun, TaskRunError, TaskRunStatus } from "./types";

interface CreateTaskRunInput {
  kind: string;
  scopeKey: string;
  idempotencyKey?: string;
  input: unknown;
}

interface TransitionPatch {
  progress?: Record<string, unknown> | null;
  result?: unknown;
  error?: TaskRunError | null;
  providerJobId?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

const ALLOWED_TASK_TRANSITIONS: Record<
  TaskRunStatus,
  readonly TaskRunStatus[]
> = {
  queued: ["running", "cancelled"],
  running: ["waiting", "completed", "failed", "cancelled"],
  waiting: ["queued", "cancelled"],
  completed: [],
  failed: [],
  cancelled: [],
};

export async function createTaskRun(
  db: AppDatabase,
  input: CreateTaskRunInput,
): Promise<{ taskRun: TaskRun; created: boolean }> {
  const [created] = await db
    .insert(taskRuns)
    .values({
      kind: input.kind,
      scopeKey: input.scopeKey,
      idempotencyKey: input.idempotencyKey,
      input: input.input,
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return { taskRun: created, created: true };
  }

  if (!input.idempotencyKey) {
    throw new Error("Task creation failed without an idempotency key.");
  }

  const [existing] = await db
    .select()
    .from(taskRuns)
    .where(
      and(
        eq(taskRuns.scopeKey, input.scopeKey),
        eq(taskRuns.kind, input.kind),
        eq(taskRuns.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);

  if (!existing) {
    throw new Error("Idempotent task creation lost its winning row.");
  }

  return { taskRun: existing, created: false };
}

export async function getTaskRun(
  db: AppDatabase,
  taskRunId: string,
): Promise<TaskRun | null> {
  const [taskRun] = await db
    .select()
    .from(taskRuns)
    .where(eq(taskRuns.id, taskRunId))
    .limit(1);
  return taskRun ?? null;
}

export async function getOwnedTaskRun(
  db: AppDatabase,
  taskRunId: string,
  scopeKey: string,
): Promise<TaskRun | null> {
  const [taskRun] = await db
    .select()
    .from(taskRuns)
    .where(and(eq(taskRuns.id, taskRunId), eq(taskRuns.scopeKey, scopeKey)))
    .limit(1);
  return taskRun ?? null;
}

export async function transitionTaskRun(
  db: AppDatabase,
  input: {
    taskRunId: string;
    from: readonly TaskRunStatus[];
    to: TaskRunStatus;
    patch?: TransitionPatch;
  },
): Promise<TaskRun | null> {
  if (
    input.from.length === 0 ||
    input.from.some(
      (status) => !ALLOWED_TASK_TRANSITIONS[status].includes(input.to),
    )
  ) {
    throw new Error(
      `Invalid task transition from ${input.from.join("/")} to ${input.to}.`,
    );
  }

  const [updated] = await db
    .update(taskRuns)
    .set({
      status: input.to,
      ...input.patch,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(taskRuns.id, input.taskRunId),
        inArray(taskRuns.status, [...input.from]),
      ),
    )
    .returning();
  return updated ?? null;
}

export async function cancelTaskRun(
  db: AppDatabase,
  taskRunId: string,
): Promise<TaskRun | null> {
  return transitionTaskRun(db, {
    taskRunId,
    from: ["queued", "running", "waiting"],
    to: "cancelled",
    patch: { completedAt: new Date() },
  });
}

export async function updateTaskRunProgress(
  db: AppDatabase,
  taskRunId: string,
  progress: Record<string, unknown>,
): Promise<TaskRun | null> {
  const [updated] = await db
    .update(taskRuns)
    .set({ progress, updatedAt: new Date() })
    .where(and(eq(taskRuns.id, taskRunId), eq(taskRuns.status, "running")))
    .returning();
  return updated ?? null;
}

export async function setProviderJobIdIfAbsent(
  db: AppDatabase,
  taskRunId: string,
  providerJobId: string,
): Promise<string | null> {
  const [updated] = await db
    .update(taskRuns)
    .set({ providerJobId, updatedAt: new Date() })
    .where(
      and(
        eq(taskRuns.id, taskRunId),
        inArray(taskRuns.status, ["running", "cancelled"]),
        isNull(taskRuns.providerJobId),
      ),
    )
    .returning({ providerJobId: taskRuns.providerJobId });

  if (updated?.providerJobId) {
    return updated.providerJobId;
  }

  return (await getTaskRun(db, taskRunId))?.providerJobId ?? null;
}
