import { createDatabaseClient } from "@/database/client";
import { createAiModels } from "@/lib/ai/models.node";
import { JobQueue } from "@/lib/jobs/queue";
import { loadWorkerEnv } from "@/lib/jobs/worker-env";

async function main(): Promise<void> {
  const workerEnv = loadWorkerEnv();
  const database = createDatabaseClient({
    url: workerEnv.DATABASE_URL,
    max: workerEnv.DB_POOL_SIZE,
    idleTimeout: workerEnv.DB_IDLE_TIMEOUT,
    maxLifetime: workerEnv.DB_MAX_LIFETIME,
    connectTimeout: workerEnv.DB_CONNECT_TIMEOUT,
  });

  createAiModels({
    apiKey: workerEnv.LLM_API_KEY,
    baseUrl: workerEnv.LLM_BASE_URL,
    defaultModel: workerEnv.AI_DEFAULT_MODEL,
  });

  if (process.env.WORKER_SMOKE_TEST === "1") {
    await database.close();
    console.log("Worker artifact smoke test passed.");
    return;
  }

  const queue = new JobQueue(
    {
      connectionString: workerEnv.JOB_DATABASE_URL,
      poolSize: workerEnv.JOB_DB_POOL_SIZE,
    },
    { supervise: true },
  );

  try {
    await queue.registerWorkers(database.db);
  } catch (error) {
    await Promise.allSettled([
      queue.stop(workerEnv.WORKER_GRACEFUL_TIMEOUT_MS),
      database.close(),
    ]);
    throw error;
  }

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(
      JSON.stringify({ component: "job-worker", event: "shutdown", signal }),
    );

    try {
      await queue.stop(workerEnv.WORKER_GRACEFUL_TIMEOUT_MS);
      await database.close();
      process.exitCode = 0;
    } catch (error) {
      console.error(
        JSON.stringify({
          component: "job-worker",
          event: "shutdown_failed",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
  console.log(
    JSON.stringify({ component: "job-worker", event: "worker_ready" }),
  );
}

void main().catch((error) => {
  console.error(
    JSON.stringify({
      component: "job-worker",
      event: "worker_start_failed",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exitCode = 1;
});
