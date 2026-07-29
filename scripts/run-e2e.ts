import { spawnSync } from "node:child_process";

import { resolveE2EEnvironment } from "../e2e/environment";

function run(command: string, args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const e2e = resolveE2EEnvironment();
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const sharedEnv = {
  ...process.env,
  E2E_DATABASE_URL: e2e.databaseUrl,
  E2E_BASE_URL: e2e.origin,
  NEXT_PUBLIC_APP_URL: e2e.origin,
};
const buildEnv = {
  ...sharedEnv,
  DATABASE_URL: e2e.databaseUrl,
};
const playwrightEnv = { ...sharedEnv };

run(pnpmCommand, ["db:migrate"], buildEnv);
run(pnpmCommand, ["build"], buildEnv);
run(
  pnpmCommand,
  ["exec", "playwright", "test", ...process.argv.slice(2)],
  playwrightEnv,
);
