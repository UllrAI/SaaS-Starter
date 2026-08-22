import { spawn } from "node:child_process";

const databaseUrl = process.env.JOBS_TEST_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("JOBS_TEST_DATABASE_URL is required.");
}

const child = spawn(process.execPath, ["dist/worker/worker.mjs"], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    JOB_DATABASE_URL: databaseUrl,
    WORKER_GRACEFUL_TIMEOUT_MS: "5000",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
let ready = false;
const timeout = setTimeout(() => {
  child.kill("SIGKILL");
}, 15_000);

child.stdout.on("data", (chunk) => {
  output += chunk.toString();
  if (!ready && output.includes('"event":"worker_ready"')) {
    ready = true;
    child.kill("SIGTERM");
  }
});
child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

const result = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => resolve({ code, signal }));
});
clearTimeout(timeout);

if (
  !ready ||
  result.code !== 0 ||
  !output.includes('"event":"shutdown"') ||
  result.signal
) {
  process.stderr.write(output);
  throw new Error(
    `Worker graceful shutdown smoke test failed (${result.signal ?? `exit ${result.code}`}).`,
  );
}

console.log("Worker graceful shutdown smoke test passed.");
