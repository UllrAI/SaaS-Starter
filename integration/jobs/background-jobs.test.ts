import { afterAll, beforeAll, describe, expect, it, jest } from "@jest/globals";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { PgBoss } from "pg-boss";
import { z } from "zod";
import { createDatabaseClient } from "@/database/client";
import { taskRuns, taskDispatches } from "@/database/schema";
import { defineJob } from "@/lib/jobs/definition";
import { JobQueue } from "@/lib/jobs/queue";
import { ensureProviderJobSubmitted } from "@/lib/tasks/provider-submission";
import {
  cancelTaskRun,
  createTaskRun,
  getTaskRun,
  transitionTaskRun,
} from "@/lib/tasks/repository";
import {
  createBackgroundTask,
  enqueueBackgroundTaskContinuation,
} from "@/lib/tasks/service";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const queueName = "integration.background-jobs";
const scopePrefix = `user:jobs-integration-${process.pid}`;
const calls = new Map<string, number>();
const activeByScope = new Map<string, number>();
const maxActiveByScope = new Map<string, number>();
let totalActive = 0;
let maxTotalActive = 0;

const integrationJob = defineJob(
  queueName,
  z.discriminatedUnion("mode", [
    z.object({ mode: z.literal("success"), delayMs: z.number().int().min(0) }),
    z.object({ mode: z.literal("retry"), failures: z.number().int().min(0) }),
    z.object({ mode: z.literal("fail") }),
    z.object({
      mode: z.literal("defer"),
      step: z.enum(["submit", "poll"]),
    }),
  ]),
  async (payload, context) => {
    calls.set(context.taskRunId, (calls.get(context.taskRunId) ?? 0) + 1);

    if (payload.mode === "retry" && context.attempt <= payload.failures) {
      throw new Error(`retry attempt ${context.attempt}`);
    }
    if (payload.mode === "fail") {
      throw new Error("permanent test failure after retries");
    }
    if (payload.mode === "defer" && payload.step === "submit") {
      await context.scheduleContinuation(
        { mode: "defer", step: "poll" },
        new Date(Date.now() + 500),
      );
      return { deferred: true };
    }
    if (payload.mode === "success" && payload.delayMs > 0) {
      const scopeActive = (activeByScope.get(context.scopeKey) ?? 0) + 1;
      activeByScope.set(context.scopeKey, scopeActive);
      maxActiveByScope.set(
        context.scopeKey,
        Math.max(maxActiveByScope.get(context.scopeKey) ?? 0, scopeActive),
      );
      totalActive += 1;
      maxTotalActive = Math.max(maxTotalActive, totalActive);
      await new Promise((resolve) => setTimeout(resolve, payload.delayMs));
      activeByScope.set(context.scopeKey, scopeActive - 1);
      totalActive -= 1;
    }

    return { attempt: context.attempt };
  },
  {
    queue: {
      retryLimit: 1,
      retryDelay: 0,
      retryBackoff: false,
      expireInSeconds: 30,
    },
    localConcurrency: 4,
    groupConcurrency: 1,
  },
);

const database = createDatabaseClient({
  url: databaseUrl,
  max: 8,
  connectTimeout: 4,
});
const queueConfig = { connectionString: databaseUrl, poolSize: 3 };
const workerA = new JobQueue(queueConfig, { supervise: true });
const workerB = new JobQueue(queueConfig, { supervise: true });

async function waitForTask(
  taskRunId: string,
  statuses: readonly string[],
  timeoutMs = 15_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const taskRun = await getTaskRun(database.db, taskRunId);
    if (taskRun && statuses.includes(taskRun.status)) return taskRun;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Task ${taskRunId} did not reach ${statuses.join("/")} within ${timeoutMs}ms.`,
  );
}

async function createTask(
  scopeKey: string,
  payload: z.infer<typeof integrationJob.schema>,
  idempotencyKey?: string,
) {
  return createBackgroundTask({
    db: database.db,
    queue: workerA,
    definition: integrationJob,
    scopeKey,
    payload,
    idempotencyKey,
  });
}

beforeAll(async () => {
  const migrationBoss = new PgBoss({
    connectionString: databaseUrl,
    schema: "pgboss",
    max: 2,
    migrate: false,
    createSchema: false,
    supervise: false,
    schedule: false,
  });
  await migrationBoss.start();
  if (await migrationBoss.getQueue(queueName)) {
    await migrationBoss.deleteAllJobs(queueName);
    await migrationBoss.deleteQueue(queueName);
  }
  await migrationBoss.createQueue(queueName, {
    policy: "singleton",
    ...integrationJob.queue,
  });
  await migrationBoss.updateQueue(queueName, integrationJob.queue);
  expect(await migrationBoss.schemaVersion()).toBeGreaterThan(0);
  await migrationBoss.stop({ close: true });

  await database.db
    .delete(taskRuns)
    .where(eq(taskRuns.kind, integrationJob.name));
  await Promise.all([
    workerA.registerWorker(database.db, integrationJob),
    workerB.registerWorker(database.db, integrationJob),
  ]);
}, 30_000);

afterAll(async () => {
  await Promise.all([workerA.stop(10_000), workerB.stop(10_000)]);
  await database.db
    .delete(taskRuns)
    .where(eq(taskRuns.kind, integrationJob.name));
  await database.close();
}, 30_000);

describe("background jobs with PostgreSQL", () => {
  it("rolls back new acceptance when a scope already has 100 unfinished tasks", async () => {
    const scopeKey = `${scopePrefix}:capacity`;
    try {
      await database.db.insert(taskRuns).values(
        Array.from({ length: 100 }, () => ({
          kind: "integration.capacity",
          scopeKey,
          input: {},
        })),
      );
      await expect(
        createTask(scopeKey, { mode: "success", delayMs: 0 }),
      ).rejects.toThrow(/Too many unfinished tasks/);
      expect(
        await database.db
          .select()
          .from(taskRuns)
          .where(eq(taskRuns.scopeKey, scopeKey)),
      ).toHaveLength(100);
    } finally {
      await database.db.delete(taskRuns).where(eq(taskRuns.scopeKey, scopeKey));
    }
  });

  it("recovers acceptance when queue delivery fails after the DB commit", async () => {
    const delivery = jest
      .spyOn(workerA, "dispatchPending")
      .mockRejectedValueOnce(new Error("queue connection unavailable"));
    const accepted = await createTask(`${scopePrefix}:outbox`, {
      mode: "success",
      delayMs: 0,
    });
    delivery.mockRestore();
    const [dispatch] = await database.db
      .select()
      .from(taskDispatches)
      .where(eq(taskDispatches.taskRunId, accepted.taskRun.id));
    expect(dispatch.payload).toEqual(accepted.taskRun.input);
    expect(dispatch.id).toBe(accepted.taskRun.dispatchId);
    await waitForTask(accepted.taskRun.id, ["completed"]);
    expect(calls.get(accepted.taskRun.id)).toBe(1);
  });

  it("recovers delivery acknowledged by the queue but not by the dispatcher", async () => {
    const enqueue = workerA.enqueue.bind(workerA);
    const uncertain = jest
      .spyOn(workerA, "enqueue")
      .mockImplementationOnce(async (...args) => {
        await enqueue(...args);
        throw new Error("connection lost before acknowledgement");
      });
    const accepted = await createTask(`${scopePrefix}:uncertain`, {
      mode: "success",
      delayMs: 0,
    });
    uncertain.mockRestore();
    await waitForTask(accepted.taskRun.id, ["completed"]);
    expect(calls.get(accepted.taskRun.id)).toBe(1);
  });

  it("rejects a reused idempotency key with different accepted input", async () => {
    const scope = `${scopePrefix}:input-conflict`;
    const first = await createTask(
      scope,
      { mode: "success", delayMs: 0 },
      "key",
    );
    await expect(createTask(scope, { mode: "fail" }, "key")).rejects.toThrow(
      /different input/,
    );
    await waitForTask(first.taskRun.id, ["completed"]);
    expect((await getTaskRun(database.db, first.taskRun.id))?.input).toEqual({
      mode: "success",
      delayMs: 0,
    });
  });

  it("reconciles a supervisor terminal state even when the handler never finishes", async () => {
    const { taskRun } = await createTaskRun(database.db, {
      kind: queueName,
      scopeKey: `${scopePrefix}:supervisor`,
      input: { mode: "success", delayMs: 0 },
    });
    const id = randomUUID();
    await database.db
      .update(taskRuns)
      .set({ dispatchId: id, status: "running" })
      .where(eq(taskRuns.id, taskRun.id));
    await database.db.insert(taskDispatches).values({
      id,
      taskRunId: taskRun.id,
      kind: queueName,
      scopeKey: taskRun.scopeKey,
      payload: taskRun.input,
      sentAt: new Date(),
    });
    const boss = await workerA.start();
    await boss.send(
      queueName,
      {
        taskRunId: taskRun.id,
        scopeKey: taskRun.scopeKey,
        payload: taskRun.input,
      },
      { id, startAfter: new Date(Date.now() + 3_600_000) },
    );
    await boss
      .getDb()
      .executeSql(
        "UPDATE pgboss.job SET state = 'failed', completed_on = now() WHERE id = $1",
        [id],
      );
    const result = await waitForTask(taskRun.id, ["failed"]);
    expect(result.error?.code).toBe("QUEUE_JOB_TERMINATED");
    expect(calls.get(taskRun.id)).toBeUndefined();
  });

  it("deduplicates task creation in the application and queue layers", async () => {
    const scopeKey = `${scopePrefix}:dedup`;
    const [first, second] = await Promise.all([
      createTask(scopeKey, { mode: "success", delayMs: 100 }, "same-request"),
      createTask(scopeKey, { mode: "success", delayMs: 100 }, "same-request"),
    ]);

    expect(first.taskRun.id).toBe(second.taskRun.id);
    expect([first.created, second.created].sort()).toEqual([false, true]);
    await waitForTask(first.taskRun.id, ["completed"]);
    expect(calls.get(first.taskRun.id)).toBe(1);
  });

  it("retries and exposes the final failed product state", async () => {
    const retried = await createTask(`${scopePrefix}:retry`, {
      mode: "retry",
      failures: 1,
    });
    const completed = await waitForTask(retried.taskRun.id, ["completed"]);
    expect(completed.result).toEqual({ attempt: 2 });
    expect(calls.get(retried.taskRun.id)).toBe(2);

    const failed = await createTask(`${scopePrefix}:failed`, { mode: "fail" });
    const terminal = await waitForTask(failed.taskRun.id, ["failed"]);
    expect(terminal.error).toMatchObject({
      code: "JOB_HANDLER_FAILED",
      retryable: false,
      attempt: 2,
    });
    expect(calls.get(failed.taskRun.id)).toBe(2);
  });

  it("enforces group concurrency globally while allowing other scopes", async () => {
    maxTotalActive = 0;
    const scopeA = `${scopePrefix}:group-a`;
    const scopeB = `${scopePrefix}:group-b`;
    const tasks = await Promise.all([
      createTask(scopeA, { mode: "success", delayMs: 250 }),
      createTask(scopeA, { mode: "success", delayMs: 250 }),
      createTask(scopeB, { mode: "success", delayMs: 250 }),
    ]);

    await Promise.all(
      tasks.map(({ taskRun }) => waitForTask(taskRun.id, ["completed"])),
    );
    expect(maxActiveByScope.get(scopeA)).toBe(1);
    expect(maxActiveByScope.get(scopeB)).toBe(1);
    expect(maxTotalActive).toBeGreaterThanOrEqual(2);
  });

  it("uses guarded transitions for cancel/complete and stale continuations", async () => {
    const { taskRun } = await createTaskRun(database.db, {
      kind: integrationJob.name,
      scopeKey: `${scopePrefix}:race`,
      input: { mode: "success", delayMs: 0 },
    });
    await transitionTaskRun(database.db, {
      taskRunId: taskRun.id,
      from: ["queued"],
      to: "running",
      patch: { startedAt: new Date() },
    });

    const [cancelled, completed] = await Promise.all([
      cancelTaskRun(database.db, taskRun.id),
      transitionTaskRun(database.db, {
        taskRunId: taskRun.id,
        from: ["running"],
        to: "completed",
        patch: { completedAt: new Date() },
      }),
    ]);
    expect([cancelled, completed].filter(Boolean)).toHaveLength(1);

    const terminal = await getTaskRun(database.db, taskRun.id);
    expect(["cancelled", "completed"]).toContain(terminal?.status);
    expect(
      await transitionTaskRun(database.db, {
        taskRunId: taskRun.id,
        from: ["waiting"],
        to: "queued",
      }),
    ).toBeNull();
  });

  it("releases the Worker while a delayed provider poll is waiting", async () => {
    const scopeKey = `${scopePrefix}:continuation`;
    const deferred = await createTask(scopeKey, {
      mode: "defer",
      step: "submit",
    });
    await waitForTask(deferred.taskRun.id, ["waiting"]);

    const otherTask = await createTask(scopeKey, {
      mode: "success",
      delayMs: 0,
    });
    await waitForTask(otherTask.taskRun.id, ["completed"]);
    const completed = await waitForTask(deferred.taskRun.id, ["completed"]);

    expect(completed.result).toEqual({ attempt: 1 });
    expect(calls.get(deferred.taskRun.id)).toBe(2);
  });

  it("treats a provider webhook arriving after cancellation as a no-op", async () => {
    const scopeKey = `${scopePrefix}:cancelled-webhook`;
    const { taskRun } = await createTaskRun(database.db, {
      kind: integrationJob.name,
      scopeKey,
      input: { mode: "defer", step: "poll" },
    });
    await transitionTaskRun(database.db, {
      taskRunId: taskRun.id,
      from: ["queued"],
      to: "running",
      patch: { startedAt: new Date() },
    });
    await transitionTaskRun(database.db, {
      taskRunId: taskRun.id,
      from: ["running"],
      to: "waiting",
    });
    await cancelTaskRun(database.db, taskRun.id);

    expect(
      await enqueueBackgroundTaskContinuation({
        db: database.db,
        queue: workerA,
        definition: integrationJob,
        taskRunId: taskRun.id,
        scopeKey,
        payload: { mode: "defer", step: "poll" },
        continuationJobId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toBe(false);
    expect((await getTaskRun(database.db, taskRun.id))?.status).toBe(
      "cancelled",
    );
  });

  it("recovers a provider submission after a crash with provider idempotency", async () => {
    const { taskRun } = await createTaskRun(database.db, {
      kind: integrationJob.name,
      scopeKey: `${scopePrefix}:provider`,
      input: {},
    });
    await transitionTaskRun(database.db, {
      taskRunId: taskRun.id,
      from: ["queued"],
      to: "running",
      patch: { startedAt: new Date() },
    });

    const providerJobs = new Map<string, string>();
    await expect(
      ensureProviderJobSubmitted({
        db: database.db,
        taskRunId: taskRun.id,
        submit: async ({ idempotencyKey }) => {
          providerJobs.set(idempotencyKey, "provider-job-1");
          throw new Error("worker crashed before persistence");
        },
      }),
    ).rejects.toThrow("worker crashed");

    const providerJobId = await ensureProviderJobSubmitted({
      db: database.db,
      taskRunId: taskRun.id,
      submit: async ({ idempotencyKey }) =>
        providerJobs.get(idempotencyKey) ?? "unexpected-duplicate",
    });
    expect(providerJobId).toBe("provider-job-1");
    expect((await getTaskRun(database.db, taskRun.id))?.providerJobId).toBe(
      "provider-job-1",
    );
  });
});
