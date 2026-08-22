import { spawn } from "node:child_process";

function run(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        JOB_DATABASE_URL: process.env.JOB_DATABASE_URL,
      },
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} failed with exit code ${code}.`)),
    );
  });
}

async function main(): Promise<void> {
  const databaseUrl =
    process.env.JOBS_TEST_DATABASE_URL ?? process.env.E2E_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "JOBS_TEST_DATABASE_URL or E2E_DATABASE_URL is required for job integration tests.",
    );
  }

  const databaseName = new URL(databaseUrl).pathname.slice(1).toLowerCase();
  if (!/(^|[_-])(e2e|test)([_-]|$)/.test(databaseName)) {
    throw new Error(
      "Job integration tests require a dedicated e2e/test database.",
    );
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.JOB_DATABASE_URL = databaseUrl;
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  await run(pnpmCommand, ["db:migrate"]);
  await run(pnpmCommand, [
    "exec",
    "jest",
    "--config",
    "jest.jobs-integration.config.js",
    "--runInBand",
  ]);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
