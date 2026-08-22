import { randomUUID } from "node:crypto";
import { PgBoss, type JobResult, type JobWithMetadata } from "pg-boss";
import { z } from "zod";
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

  async cancel(name: string, taskRunId: string): Promise<void> {
    const boss = await this.start();
    await boss.cancel(name, taskRunId);
  }

  async registerWorkers(db: AppDatabase): Promise<void> {
    const boss = await this.start();

    for (const definition of jobDefinitions) {
      await this.registerWorker(db, definition);
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
        event: "queue_ready",
        jobName: definition.name,
        backlog: stats?.readyCount ?? 0,
        oldestPendingAgeSeconds: oldest
          ? Math.max(0, Math.floor((Date.now() - oldest.getTime()) / 1000))
          : 0,
      });
    }
  }

  async registerWorker<Name extends string, Schema extends z.ZodType, Result>(
    db: AppDatabase,
    definition: JobDefinition<Name, Schema, Result>,
  ): Promise<void> {
    const boss = await this.start();
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
          from: ["waiting"],
          to: "queued",
        })) ?? (await getTaskRun(db, taskRunId));
    }

    if (taskRun?.status === "queued") {
      taskRun =
        (await transitionTaskRun(db, {
          taskRunId,
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
        const waiting = await transitionTaskRun(db, {
          taskRunId,
          from: ["running"],
          to: "waiting",
        });
        if (!waiting) return false;

        try {
          await this.enqueue(
            definition,
            { taskRunId, scopeKey, payload: nextPayload },
            { jobId: randomUUID(), startAfter },
          );
          return true;
        } catch (error) {
          await transitionTaskRun(db, {
            taskRunId,
            from: ["waiting"],
            to: "queued",
          });
          throw error;
        }
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
