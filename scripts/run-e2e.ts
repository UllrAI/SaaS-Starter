import { spawnSync } from "node:child_process";
import { createServer } from "node:net";

import { resolveE2EEnvironment } from "../e2e/environment";

function run(command: string, args: string[], env: NodeJS.ProcessEnv): number {
  const result = spawnSync(command, args, {
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
}

async function main(): Promise<void> {
  const e2e = resolveE2EEnvironment();
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  let origin = e2e.origin;
  const reservation =
    process.env.CI === "true" && !process.env.E2E_BASE_URL?.trim()
      ? createServer((socket) => socket.destroy())
      : undefined;

  if (reservation) {
    await new Promise<void>((resolve, reject) => {
      reservation.once("error", reject);
      reservation.listen(0, "127.0.0.1", resolve);
    });
    const address = reservation.address();
    if (!address || typeof address === "string") {
      reservation.close();
      throw new Error("Could not reserve a local port for Playwright.");
    }
    origin = `http://127.0.0.1:${address.port}`;
  }

  const sharedEnv = {
    ...process.env,
    E2E_DATABASE_URL: e2e.databaseUrl,
    E2E_BASE_URL: origin,
    NEXT_PUBLIC_APP_URL: origin,
  };
  const buildEnv = { ...sharedEnv, DATABASE_URL: e2e.databaseUrl };

  console.log(`Playwright origin: ${origin}`);
  let status: number;
  try {
    status =
      run(pnpmCommand, ["db:migrate"], buildEnv) ||
      run(pnpmCommand, ["build"], buildEnv);
  } finally {
    // Next.js needs the origin at build time. Release it when Playwright can bind it.
    if (reservation) {
      await new Promise<void>((resolve, reject) =>
        reservation.close((error) => (error ? reject(error) : resolve())),
      );
    }
  }
  process.exitCode =
    status ||
    run(
      pnpmCommand,
      ["exec", "playwright", "test", ...process.argv.slice(2)],
      sharedEnv,
    );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
