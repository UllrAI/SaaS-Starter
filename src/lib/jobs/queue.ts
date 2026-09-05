import { randomUUID } from "node:crypto";
import { PgBoss, type JobResult, type JobWithMetadata } from "pg-boss";
import { z } from "zod";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { taskDispatches, taskRuns } from "@/database/schema";
import { scheduleTaskContinuation } from "@/lib/tasks/dispatch";
import type { AppDatabase } from "@/database/client";
import {
  getTaskRun,
  transitionTaskRun,
  updateTaskRunProgress,
} from "@/lib/tasks/repository";
import type { TaskRunError } from "@/lib/tasks/types";
import { ensureProviderJobSubmitted } from "@/lib/tasks/provider-submission";
import { deadLetterQueueName, jobDefinitions } from "./catalog";
import {
  type JobDefinition,
  type JobHandlerContext,
  PermanentJobError,
} from "./definition";

const envelopeSchema = z
  .object({
    taskRunId: z.uuid(),
    scopeKey: z.string().min(1).max(500),
    payload: z.unknown(),
  })
  .strict();

type JobEnvelope = z.infer<typeof envelopeSchema>;

export interface JobQueueConfig {
  connectionString: string;
  poolSize: number;
  schema?: string;
}

interface EnqueueOptions {
  startAfter?: Date | number;
  jobId?: string;
}

function log(level: "info" | "error" | "warn", data: object): void {
  console[level](JSON.stringify({ component: "job-worker", ...data }));
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export class JobQueue {
  readonly #boss: PgBoss;
  readonly #schema: string;
  #startPromise: Promise<PgBoss> | null = null;
  #startAttempted = false;
  #reconcileCursor = new Map<string, string>();
  #maintenanceTimers: ReturnType<typeof setInterval>[] = [];
  #maintenance = new Set<Promise<void>>();

  constructor(
    config: JobQueueConfig,
    options: { migrate?: boolean; supervise?: boolean } = {},
  ) {
    this.#schema = config.schema ?? "pgboss";
    this.#boss = new PgBoss({
      connectionString: config.connectionString,
      schema: this.#schema,
      max: config.poolSize,
      useListenNotify: false,
      migrate: options.migrate ?? false,
      createSchema: options.migrate ?? false,
      supervise: options.supervise ?? false,
      schedule: false,
      persistWarnings: true,
      warningQueueSize: 100,
    });
    this.#boss.on("error", (error) => {
      log("error", { event: "queue_error", error: toError(error).message });
    });
    this.#boss.on("warning", (warning) => {
      log("warn", { event: "queue_warning", warning });
    });
  }

  async start(): Promise<PgBoss> {
    if (!this.#startPromise) {
      this.#startAttempted = true;
      this.#startPromise = this.#boss.start().catch((error) => {
        this.#startPromise = null;
        throw error;
      });
    }
    return this.#startPromise;
  }

  async enqueue<Name extends string, Schema extends z.ZodType, Result>(
    definition: JobDefinition<Name, Schema, Result>,
    envelope: {
      taskRunId: string;
      scopeKey: string;
      payload: z.infer<Schema>;
    },
    options: EnqueueOptions = {},
  ): Promise<string | null> {
    const boss = await this.start();
    return boss.send(definition.name, envelope, {
      id: options.jobId ?? envelope.taskRunId,
      singletonKey: envelope.scopeKey,
      group: { id: envelope.scopeKey },
      startAfter: options.startAfter,
    });
  }

  async dispatchPending<Name extends string, Schema extends z.ZodType, Result>(
    db: AppDatabase,
    definition: JobDefinition<Name, Schema, Result>,
  ): Promise<void> {
    const rows = await db
      .select()
      .from(taskDispatches)
      .where(
        and(
          eq(taskDispatches.kind, definition.name),
          isNull(taskDispatches.sentAt),
        ),
      )
      .orderBy(taskDispatches.createdAt)
      .limit(100);
    for (const row of rows) {
      const task = await getTaskRun(db, row.taskRunId);
      if (
        !task ||
        task.dispatchId !== row.id ||
        ["completed", "failed", "cancelled"].includes(task.status)
      ) {
        await db.delete(taskDispatches).where(eq(taskDispatches.id, row.id));
        continue;
      }
      await this.enqueue(
        definition,
        {
          taskRunId: row.taskRunId,
          scopeKey: row.scopeKey,
          payload: definition.schema.parse(row.payload),
        },
        { jobId: row.id, startAfter: row.startAfter },
      );
      await db
        .update(taskDispatches)
        .set({ sentAt: new Date() })
        .where(eq(taskDispatches.id, row.id));
    }
  }

  async reconcileTasks(db: AppDatabase, kind: string): Promise<void> {
    const boss = await this.start();
    const tasks = await db
      .select()
      .from(taskRuns)
      .where(
        and(
          eq(taskRuns.kind, kind),
          inArray(taskRuns.status, ["queued", "running", "waiting"]),
          this.#reconcileCursor.has(kind)
            ? gt(taskRuns.id, this.#reconcileCursor.get(kind)!)
            : undefined,
        ),
      )
      .orderBy(taskRuns.id)
      .limit(100);
    if (tasks.length === 100) this.#reconcileCursor.set(kind, tasks.at(-1)!.id);
    else this.#reconcileCursor.delete(kind);
    for (const task of tasks) {
      if (!task.dispatchId) {
        // Adopt in-flight jobs from the pre-outbox release, including polls
        // whose payload differs from the original task input.
        const { rows } = await boss.getDb().executeSql(
          `SELECT id, data, start_after AS "startAfter", created_on AS "createdAt"
           FROM ${this.#schema}.job WHERE name = $1 AND data->>'taskRunId' = $2
           ORDER BY created_on DESC LIMIT 1`,
          [kind, task.id],
        );
        const legacy = rows[0] as
          | { id: string; data: JobEnvelope; startAfter: Date; createdAt: Date }
          | undefined;
        if (!legacy && task.status !== "queued") continue;
        await db.transaction(async (tx) => {
          const id = legacy?.id ?? task.id;
          const [adopted] = await tx
            .update(taskRuns)
            .set({ dispatchId: id })
            .where(and(eq(taskRuns.id, task.id), isNull(taskRuns.dispatchId)))
            .returning();
          if (adopted)
            await tx
              .insert(taskDispatches)
              .values({
                id,
                taskRunId: task.id,
                kind,
                scopeKey: task.scopeKey,
                payload: legacy?.data.payload ?? task.input,
                startAfter: legacy?.startAfter,
                sentAt: legacy ? legacy.createdAt : null,
              })
              .onConflictDoNothing();
        });
        continue;
      }
      const [dispatch] = await db
        .select()
        .from(taskDispatches)
        .where(eq(taskDispatches.id, task.dispatchId));
      if (!dispatch?.sentAt) continue;
      const job = await boss.getJobById(kind, dispatch.id);
      if (
        job &&
        !["failed", "cancelled"].includes(job.state) &&
        !(job.state === "completed" && task.status !== "waiting")
      )
        continue;
      // A missing job after confirmed delivery has exceeded queue retention.
      if (!job && Date.now() - dispatch.sentAt.getTime() < 60_000) continue;
      await db
        .update(taskRuns)
        .set({
          status: "failed",
          completedAt: new Date(),
          updatedAt: new Date(),
          error: {
            code: "QUEUE_JOB_TERMINATED",
            message: "Background execution ended before completion.",
            retryable: false,
            attempt: job ? job.retryCount + 1 : 0,
          },
        })
        .where(
          and(
            eq(taskRuns.id, task.id),
            eq(taskRuns.dispatchId, dispatch.id),
            inArray(taskRuns.status, ["queued", "running", "waiting"]),
          ),
        );
    }
  }

  async cancel(name: string, taskRunId: string): Promise<void> {
    const boss = await this.start();
    await boss.cancel(name, taskRunId);
  }

  async registerWorkers(db: AppDatabase): Promise<void> {
    const boss = await this.start();

    for (const definition of jobDefinitions) {
      await this.registerWorker(db, definition);
    }
    const report = async () => {
      for (const definition of jobDefinitions) {
        const [stats] = await boss.getQueueStats(definition.name, {
          force: true,
        });
        const { rows } = await boss.getDb().executeSql(
          `SELECT MIN(created_on) AS "oldestCreatedOn"
         FROM ${this.#schema}.job
         WHERE name = $1 AND state IN ('created', 'retry')`,
          [definition.name],
        );
        const oldest = rows[0]?.oldestCreatedOn
          ? new Date(rows[0].oldestCreatedOn as string | Date)
          : null;
        log("info", {
          event: "queue_metrics",
          jobName: definition.name,
          backlog: stats?.readyCount ?? 0,
          oldestPendingAgeSeconds: oldest
            ? Math.max(0, Math.floor((Date.now() - oldest.getTime()) / 1000))
            : 0,
        });
      }
    };
    await report();
    const timer = setInterval(() => {
      const running = report().catch((error) =>
        log("error", {
          event: "queue_metrics_failed",
          error: toError(error).message,
        }),
      );
      this.#maintenance.add(running);
      void running.finally(() => this.#maintenance.delete(running));
    }, 60_000);
    timer.unref();
    this.#maintenanceTimers.push(timer);
  }

  async registerWorker<Name extends string, Schema extends z.ZodType, Result>(
    db: AppDatabase,
    definition: JobDefinition<Name, Schema, Result>,
  ): Promise<void> {
    const boss = await this.start();
    let busy = false;
    const maintain = async () => {
      if (busy) return;
      busy = true;
      try {
        await this.dispatchPending(db, definition);
        await this.reconcileTasks(db, definition.name);
      } catch (error) {
        log("error", {
          event: "dispatch_retry",
          jobName: definition.name,
          error: toError(error).message,
        });
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(() => {
      const running = maintain();
      this.#maintenance.add(running);
      void running.finally(() => this.#maintenance.delete(running));
    }, 1000);
    timer.unref();
    this.#maintenanceTimers.push(timer);
    await maintain();
    const workOptions = {
      batchSize: 1,
      includeMetadata: true,
      perJobResults: true,
      localConcurrency: definition.localConcurrency,
      groupConcurrency: definition.groupConcurrency,
    } as const;

    await boss.work<JobEnvelope, unknown, typeof workOptions>(
      definition.name,
      workOptions,
      async (jobs) =>
        Promise.all(jobs.map((job) => this.#executeJob(db, definition, job))),
    );
  }

  async #executeJob<Name extends string, Schema extends z.ZodType, Result>(
    db: AppDatabase,
    definition: JobDefinition<Name, Schema, Result>,
    job: JobWithMetadata<JobEnvelope>,
  ): Promise<JobResult> {
    const envelope = envelopeSchema.safeParse(job.data);
    if (!envelope.success) {
      log("error", {
        event: "invalid_job_envelope",
        jobName: definition.name,
        jobId: job.id,
        error: z.prettifyError(envelope.error),
      });
      return {
        id: job.id,
        status: "deadletter",
        output: { code: "INVALID_JOB_ENVELOPE" },
      };
    }

    const { taskRunId, scopeKey } = envelope.data;
    const attempt = job.retryCount + 1;
    let taskRun = await getTaskRun(db, taskRunId);

    if (taskRun?.dispatchId && taskRun.dispatchId !== job.id)
      return { id: job.id, status: "completed" };

    if (
      !taskRun ||
      taskRun.scopeKey !== scopeKey ||
      taskRun.kind !== definition.name
    ) {
      log("error", {
        event: "task_mismatch",
        jobName: definition.name,
        taskRunId,
        scopeKey,
        attempt,
      });
      return {
        id: job.id,
        status: "deadletter",
        output: { code: "TASK_MISMATCH" },
      };
    }

    if (taskRun.status === "waiting") {
      taskRun =
        (await transitionTaskRun(db, {
          taskRunId,
          dispatchId: taskRun?.dispatchId ? job.id : undefined,
          from: ["waiting"],
          to: "queued",
        })) ?? (await getTaskRun(db, taskRunId));
    }

    if (taskRun?.status === "queued") {
      taskRun =
        (await transitionTaskRun(db, {
          taskRunId,
          dispatchId: taskRun?.dispatchId ? job.id : undefined,
          from: ["queued"],
          to: "running",
          patch: { startedAt: taskRun.startedAt ?? new Date() },
        })) ?? (await getTaskRun(db, taskRunId));
    }

    if (taskRun?.status !== "running") {
      log("info", {
        event: "terminal_task_noop",
        jobName: definition.name,
        taskRunId,
        scopeKey,
        attempt,
        status: taskRun?.status ?? "missing",
      });
      return { id: job.id, status: "completed" };
    }

    const payload = definition.schema.safeParse(envelope.data.payload);
    if (!payload.success) {
      const error: TaskRunError = {
        code: "INVALID_JOB_PAYLOAD",
        message: z.prettifyError(payload.error),
        retryable: false,
        attempt,
      };
      await transitionTaskRun(db, {
        taskRunId,
        dispatchId: taskRun?.dispatchId ? job.id : undefined,
        from: ["running"],
        to: "failed",
        patch: { error, completedAt: new Date() },
      });
      log("error", {
        event: "invalid_job_payload",
        jobName: definition.name,
        taskRunId,
        scopeKey,
        attempt,
        error,
      });
      return { id: job.id, status: "deadletter", output: error };
    }

    const context: JobHandlerContext<z.infer<Schema>> = {
      taskRunId,
      scopeKey,
      attempt,
      providerIdempotencyKey: taskRunId,
      signal: job.signal,
      isCancelled: async () =>
        job.signal.aborted ||
        (await getTaskRun(db, taskRunId))?.status === "cancelled",
      updateProgress: async (progress) =>
        (await updateTaskRunProgress(db, taskRunId, progress)) !== null,
      scheduleContinuation: async (nextPayload, startAfter) => {
        return scheduleTaskContinuation(db, {
          taskRunId,
          scopeKey,
          kind: definition.name,
          payload: definition.schema.parse(nextPayload),
          dispatchId: randomUUID(),
          currentDispatchId: job.id,
          startAfter,
          from: "running",
        });
      },
      submitProviderJob: async (submit) => {
        try {
          return await ensureProviderJobSubmitted({
            db,
            taskRunId,
            submit,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message ===
              "Provider accepted the job but its id could not be persisted."
          ) {
            throw new PermanentJobError(
              "PROVIDER_JOB_ID_NOT_PERSISTED",
              error.message,
            );
          }
          throw error;
        }
      },
    };

    log("info", {
      event: "job_started",
      jobName: definition.name,
      taskRunId,
      scopeKey,
      attempt,
      retryLimit: job.retryLimit,
    });

    try {
      const result = await definition.handler(payload.data, context);
      const completed = await transitionTaskRun(db, {
        taskRunId,
        dispatchId: taskRun?.dispatchId ? job.id : undefined,
        from: ["running"],
        to: "completed",
        patch: { result, progress: null, error: null, completedAt: new Date() },
      });
      log("info", {
        event: completed ? "job_completed" : "job_completion_noop",
        jobName: definition.name,
        taskRunId,
        scopeKey,
        attempt,
      });
      return { id: job.id, status: "completed" };
    } catch (caught) {
      const cause = toError(caught);
      const permanent = cause instanceof PermanentJobError;
      const retriesExhausted = job.retryCount >= job.retryLimit;
      const error: TaskRunError = {
        code: permanent ? cause.code : "JOB_HANDLER_FAILED",
        message: permanent ? cause.message : "Background task failed.",
        retryable: !permanent && !retriesExhausted,
        attempt,
      };

      if (permanent || retriesExhausted) {
        await transitionTaskRun(db, {
          taskRunId,
          dispatchId: taskRun?.dispatchId ? job.id : undefined,
          from: ["running"],
          to: "failed",
          patch: { error, completedAt: new Date() },
        });
      }

      log("error", {
        event: permanent
          ? "job_failed_permanently"
          : retriesExhausted
            ? "job_retries_exhausted"
            : "job_retry_scheduled",
        jobName: definition.name,
        taskRunId,
        scopeKey,
        attempt,
        retryLimit: job.retryLimit,
        error,
        handlerError: { name: cause.name, message: cause.message },
      });
      return {
        id: job.id,
        status: permanent ? "deadletter" : "failed",
        output: error,
      };
    }
  }

  async stop(timeoutMs: number): Promise<void> {
    this.#maintenanceTimers.forEach(clearInterval);
    this.#maintenanceTimers = [];
    await Promise.allSettled(this.#maintenance);
    if (!this.#startAttempted) return;
    await this.#boss.stop({ close: true, graceful: true, timeout: timeoutMs });
    this.#startPromise = null;
    this.#startAttempted = false;
  }
}

export async function migrateJobQueue(config: JobQueueConfig): Promise<void> {
  const queue = new JobQueue(config, { migrate: true, supervise: true });
  try {
    const boss = await queue.start();
    await boss.createQueue(deadLetterQueueName, {
      policy: "standard",
      retryLimit: 0,
      deleteAfterSeconds: 30 * 24 * 60 * 60,
    });

    for (const definition of jobDefinitions) {
      await boss.createQueue(definition.name, {
        policy: "singleton",
        ...definition.queue,
        deadLetter: deadLetterQueueName,
      });
      await boss.updateQueue(definition.name, {
        ...definition.queue,
        deadLetter: deadLetterQueueName,
      });
    }
  } finally {
    await queue.stop(30_000);
  }
}
