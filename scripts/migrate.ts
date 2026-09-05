import { spawn } from "node:child_process";
import { migrateJobQueue } from "@/lib/jobs/queue";
import { z } from "zod";
import { databaseEnvFields } from "@/lib/config/runtime-env.mjs";

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} failed (${signal ?? `exit ${code}`}).`,
        ),
      );
    });
  });
}

async function main(): Promise<void> {
  const workerEnv = z.object(databaseEnvFields(5)).parse(process.env);
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  await run(pnpmCommand, ["db:migrate:app"]);
  await migrateJobQueue({
    connectionString: workerEnv.JOB_DATABASE_URL ?? workerEnv.DATABASE_URL,
    poolSize: workerEnv.JOB_DB_POOL_SIZE,
  });

  console.log("Application and pg-boss migrations are up to date.");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
