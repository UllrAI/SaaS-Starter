import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { resolveE2EEnvironment } from "./environment";

interface ProviderRequest {
  input?: Array<{ role?: string; content?: string | Array<{ text?: string }> }>;
}

// This fixture exercises the real Responses adapter, pg-boss Worker, and SSE
// replay. Only the paid external model is replaced by a delayed local server.
export async function startAiWorkerFixture() {
  const seen = new Set<string>();
  const promptCalls = new Map<string, number>();
  const server = createServer(async (request, response) => {
    if (request.url !== "/v1/responses") {
      response.writeHead(204);
      response.end();
      return;
    }
    let body = "";
    for await (const chunk of request) body += String(chunk);
    const input = JSON.parse(body) as ProviderRequest;
    const user = input.input
      ?.filter((message) => message.role === "user")
      .at(-1);
    const prompt =
      typeof user?.content === "string"
        ? user.content
        : (user?.content?.map((part) => part.text ?? "").join("") ?? "");
    seen.add(prompt);
    const callNumber = (promptCalls.get(prompt) ?? 0) + 1;
    promptCalls.set(prompt, callNumber);
    response.writeHead(200, { "Content-Type": "text/event-stream" });
    const emit = (event: Record<string, unknown>) =>
      response.write(`data: ${JSON.stringify(event)}\n\n`);
    emit({
      type: "response.created",
      response: {
        id: `resp_${randomUUID()}`,
        created_at: Math.floor(Date.now() / 1000),
        model: "local-e2e",
      },
    });
    const firstId = `msg_${randomUUID()}`;
    emit({
      type: "response.output_item.added",
      output_index: 0,
      item: { type: "message", id: firstId },
    });
    emit({
      type: "response.output_text.delta",
      item_id: firstId,
      output_index: 0,
      delta: "Working on your durable test.",
    });
    emit({
      type: "response.output_item.done",
      output_index: 0,
      item: { type: "message", id: firstId },
    });
    const timer = setTimeout(
      () => {
        if (prompt.includes("retry durable test") && callNumber === 1) {
          emit({
            type: "response.failed",
            sequence_number: 1,
            response: {
              error: { code: "server_error", message: "Local test failure" },
              usage: { input_tokens: 15, output_tokens: 5 },
            },
          });
          response.end();
          return;
        }
        const id = `msg_${randomUUID()}`;
        emit({
          type: "response.output_item.added",
          output_index: 1,
          item: { type: "message", id },
        });
        emit({
          type: "response.output_text.delta",
          item_id: id,
          output_index: 1,
          delta: `Durable worker answer: ${prompt}`,
        });
        emit({
          type: "response.output_item.done",
          output_index: 1,
          item: { type: "message", id },
        });
        emit({
          type: "response.completed",
          response: {
            usage: {
              input_tokens: 15,
              output_tokens: 20,
              input_tokens_details: { cached_tokens: 0 },
              output_tokens_details: { reasoning_tokens: 0 },
            },
          },
        });
        response.end();
      },
      prompt.includes("cancel") ? 10_000 : 5_000,
    );
    response.on("close", () => clearTimeout(timer));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Local AI provider did not bind.");
  const { databaseUrl } = resolveE2EEnvironment();
  const worker: ChildProcess = spawn(
    process.execPath,
    ["dist/worker/worker.mjs"],
    {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        JOB_DATABASE_URL: databaseUrl,
        LLM_BASE_URL: `http://127.0.0.1:${address.port}/v1`,
        LLM_API_KEY: "local-e2e-only",
        AI_DEFAULT_MODEL: "local-e2e",
        R2_ENDPOINT: `http://127.0.0.1:${address.port}`,
        R2_ACCESS_KEY_ID: "local-e2e-only",
        R2_SECRET_ACCESS_KEY: "local-e2e-only",
        R2_BUCKET_NAME: "local-e2e",
        WORKER_GRACEFUL_TIMEOUT_MS: "5000",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  const capture = (data: Buffer) => {
    logs = (logs + data.toString()).slice(-6000);
  };
  worker.stdout?.on("data", capture);
  worker.stderr?.on("data", capture);
  const stop = async () => {
    if (worker.exitCode === null && worker.signalCode === null) {
      const exited = once(worker, "exit");
      worker.kill("SIGTERM");
      const deadline = setTimeout(() => worker.kill("SIGKILL"), 7000);
      await exited;
      clearTimeout(deadline);
    }
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  };
  const wait = async (predicate: () => boolean, message: string) => {
    const deadline = Date.now() + 15_000;
    while (!predicate()) {
      if (
        Date.now() > deadline ||
        worker.exitCode !== null ||
        worker.signalCode !== null
      )
        throw new Error(`${message}\n${logs}`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  try {
    await wait(
      () => logs.includes('"worker_ready"'),
      "AI test Worker did not start.",
    );
  } catch (error) {
    await stop();
    throw error;
  }
  return {
    stop,
    waitForPrompt: (prompt: string) =>
      wait(
        () => seen.has(prompt),
        "AI Worker did not reach the local provider.",
      ),
  };
}
