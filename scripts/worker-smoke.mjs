import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["dist/worker/worker.mjs"], {
  encoding: "utf8",
  env: {
    ...process.env,
    DATABASE_URL: "postgresql://worker:worker@127.0.0.1/worker_smoke",
    WORKER_SMOKE_TEST: "1",
  },
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

if (!result.stdout.includes("Worker artifact smoke test passed.")) {
  throw new Error("Worker artifact did not report a successful smoke test.");
}

process.stdout.write(result.stdout);
