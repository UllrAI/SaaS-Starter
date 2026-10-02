import {
  createAgentUIStream,
  readUIMessageStream,
  isToolUIPart,
  getToolOrDynamicToolName,
  type UIMessageChunk,
} from "ai";
import { z } from "zod";
import type { AppDatabase } from "@/database/client";
import { aiRuns } from "@/database/schema";
import { eq } from "drizzle-orm";
import {
  defineJob,
  PermanentJobError,
  type JobHandlerContext,
} from "@/lib/jobs/definition";
import { AI_GENERATION_JOB } from "./durable-types";
import { appendAiRunEvents, claimAiRun, interruptAiRun } from "./durable-runs";
import { completeAiRun } from "./run-repository";
import { finalizeAiRun, persistMessageImages } from "./finalize";
import { selectGptImage1kSize } from "./image-size";
import { AI_RUN_TIMEOUT_MS } from "./limits";
import {
  AI_MODEL_UNREPORTED,
  createAiUsageCollector,
  type AiUsageEventInput,
} from "./usage";
import type { AiMessage } from "./chat-history-types";
import type { createWorkerAiRuntime } from "./runtime.node";

type Runtime = ReturnType<typeof createWorkerAiRuntime>;
let worker: { db: AppDatabase; runtime: Runtime } | undefined;

export function configureAiGenerationWorker(db: AppDatabase, runtime: Runtime) {
  worker = { db, runtime };
}

// Exported for PostgreSQL/SDK integration tests; production enters through the
// existing typed JobDefinition and transactional outbox.
export async function executeAiGeneration(
  db: AppDatabase,
  runtime: Runtime,
  runId: string,
  context: JobHandlerContext,
) {
  // Queue migrations read this job definition before content is built.
  const { isAgentId } = await import("./agents");
  const [accepted] = await db.select().from(aiRuns).where(eq(aiRuns.id, runId));
  if (!accepted || !["queued", "running"].includes(accepted.status))
    return null;
  if (accepted.providerStartedAt) {
    await interruptAiRun(db, runId);
    throw new PermanentJobError(
      "AI_GENERATION_INTERRUPTED",
      "Generation was interrupted; retry manually.",
    );
  }
  if (!accepted.input || !isAgentId(accepted.input.agentId))
    throw new PermanentJobError(
      "INVALID_AI_RUN",
      "Accepted AI run has invalid input.",
    );
  if (accepted.taskRunId !== context.taskRunId)
    throw new PermanentJobError(
      "AI_TASK_MISMATCH",
      "AI run does not belong to this task.",
    );
  if (await context.isCancelled()) return null;
  const input = accepted.input;
  const agentContext = await runtime.getContext(
    accepted.userId,
    accepted.conversationId,
    input.locale,
  );
  let messages = input.messages;
  let previousResponseId: string | undefined;
  let responseIndex = -1;
  for (let index = messages.length - 2; index >= 0; index--) {
    const candidate = messages[index];
    if (candidate.role !== "assistant" || !candidate.metadata?.responseHandle)
      continue;
    previousResponseId =
      runtime.readResponseHandle(
        candidate.metadata.responseHandle,
        accepted.userId,
        accepted.conversationId,
      ) ?? undefined;
    if (previousResponseId) responseIndex = index;
    break;
  }
  const imageSize = selectGptImage1kSize(messages);
  const agent = runtime.createAgent(
    input.agentId as Parameters<Runtime["createAgent"]>[0],
    agentContext,
    {
      reasoningEffort: input.reasoningEffort,
      imageSize,
      previousResponseId,
      allowImageGeneration: input.allowImageGeneration,
    },
  );
  messages = await runtime.resolveAttachments(
    messages.slice(responseIndex + 1),
    accepted.userId,
  );
  if (await context.isCancelled()) return null;
  const run = await claimAiRun(db, runId);
  if (!run) return null;

  const abort = new AbortController();
  const signal = AbortSignal.any([
    abort.signal,
    context.signal,
    AbortSignal.timeout(AI_RUN_TIMEOUT_MS),
  ]);
  let polling = false;
  const timer = setInterval(() => {
    if (polling) return;
    polling = true;
    void context
      .isCancelled()
      .then((cancelled) => {
        if (cancelled) abort.abort();
      })
      .catch(() => abort.abort())
      .finally(() => {
        polling = false;
      });
  }, 250);
  timer.unref();
  const startedAt = Date.now();
  const usage = createAiUsageCollector();
  let responseModelId: string | undefined;
  let finished: { message: AiMessage; usage: AiUsageEventInput } | undefined;
  let snapshot: AiMessage | undefined;
  let chunks: UIMessageChunk[] = [];
  const imageCalls = new Set(
    input.messages.flatMap((message) =>
      message.parts.flatMap((part) =>
        isToolUIPart(part) && getToolOrDynamicToolName(part) === "generateImage"
          ? [part.toolCallId]
          : [],
      ),
    ),
  );

  let writes = Promise.resolve();
  const flush = () => {
    if (!chunks.length) return;
    const batch = chunks;
    const savedSnapshot = snapshot ? structuredClone(snapshot) : undefined;
    chunks = [];
    writes = writes.then(async () => {
      const durable = await Promise.all(
        batch.map(async (chunk) => {
          if (
            chunk.type !== "tool-output-available" ||
            !imageCalls.has(chunk.toolCallId) ||
            !chunk.output ||
            typeof chunk.output !== "object" ||
            !("result" in chunk.output) ||
            typeof chunk.output.result !== "string"
          )
            return chunk;
          const message: AiMessage = {
            id: run.assistantMessageId!,
            role: "assistant",
            parts: [
              {
                type: "tool-generateImage",
                toolCallId: chunk.toolCallId,
                state: "output-available",
                input: {},
                output: chunk.output,
              },
            ],
          };
          try {
            const stored = await persistMessageImages(
              message,
              run.userId,
              runtime.storeFile,
            );
            const part = stored.parts[0];
            return { ...chunk, output: "output" in part ? part.output : {} };
          } catch (error) {
            console.error("AI image persistence will retry:", error);
            const output = { ...chunk.output };
            delete output.result;
            return {
              ...chunk,
              output: { ...output, storageStatus: "pending" },
            };
          }
        }),
      );
      for (const chunk of durable) {
        if (
          chunk.type !== "tool-output-available" ||
          !chunk.output ||
          typeof chunk.output !== "object" ||
          !("url" in chunk.output)
        )
          continue;
        const part = savedSnapshot?.parts.find(
          (part) =>
            "toolCallId" in part && part.toolCallId === chunk.toolCallId,
        );
        if (part && "output" in part) part.output = chunk.output;
      }
      if (!(await appendAiRunEvents(db, runId, durable, savedSnapshot)))
        abort.abort();
    });
    // A database failure aborts generation immediately; it cannot be retried
    // after the invocation marker even if no chunks reached storage.
    void writes.catch(() => abort.abort());
  };
  const flushTimer = setInterval(flush, 100);
  flushTimer.unref();
  try {
    const stream = await createAgentUIStream({
      agent,
      uiMessages: messages,
      abortSignal: signal,
      generateMessageId: () => run.assistantMessageId!,
      sendSources: true,
      onEnd: ({ responseMessage, finishReason, isAborted }) => {
        const message = responseMessage as AiMessage;
        finished = {
          message,
          usage: {
            userId: run.userId,
            conversationId: run.conversationId,
            messageId: message.id,
            agentId: input.agentId,
            model: responseModelId ?? AI_MODEL_UNREPORTED,
            reasoningEffort: input.reasoningEffort,
            finishReason,
            durationMs: Date.now() - startedAt,
            ...usage.totals(),
            aborted: isAborted,
            usageComplete:
              usage.isComplete() && !isAborted && finishReason !== "error",
            imageSize,
          },
        };
      },
      messageMetadata: ({ part }) => {
        usage.capture(part);
        if (part.type !== "finish-step") return undefined;
        responseModelId = part.response.modelId;
        return {
          responseHandle: runtime.createResponseHandle(
            part.response.id,
            run.userId,
            run.conversationId,
          ),
        };
      },
      onError: (error) => {
        console.error("AI worker stream failed:", error);
        return "ai_run_failed";
      },
    });
    const [events, snapshots] = stream.tee();
    const lastMessage = messages.at(-1);
    const readSnapshots = (async () => {
      for await (const message of readUIMessageStream<AiMessage>({
        stream: snapshots,
        message: lastMessage?.role === "assistant" ? lastMessage : undefined,
        terminateOnError: false,
      }))
        snapshot = structuredClone(message);
    })();
    const readEvents = (async () => {
      const reader = events.getReader();
      try {
        while (true) {
          const result = await reader.read();
          if (result.done) break;
          const chunk = result.value;
          if (
            (chunk.type === "tool-input-start" ||
              chunk.type === "tool-input-available") &&
            chunk.toolName === "generateImage"
          )
            imageCalls.add(chunk.toolCallId);
          chunks.push(chunk);
          if (chunks.length >= 64) flush();
        }
      } finally {
        reader.releaseLock();
      }
    })();
    await Promise.all([readEvents, readSnapshots]);
    clearInterval(flushTimer);
    flush();
    await writes;
    if (!finished) throw new Error("AI stream ended without a final response.");
    // Persist final message/status/accounting only after every event, including
    // finish, is durable. SSE gates terminal chunks until this transaction commits.
    await completeAiRun(db, runId, finished.message, finished.usage);
    try {
      await finalizeAiRun(db, runId, runtime.storeFile);
    } catch (error) {
      console.error("AI media finalization will retry:", error);
    }
    return { runId };
  } catch (error) {
    abort.abort();
    clearInterval(flushTimer);
    await writes.catch(() => {});
    await interruptAiRun(db, runId);
    console.error("AI generation interrupted:", error);
    throw new PermanentJobError(
      "AI_GENERATION_INTERRUPTED",
      "Generation was interrupted; retry manually.",
    );
  } finally {
    clearInterval(timer);
    clearInterval(flushTimer);
  }
}

export const aiGenerationJob = defineJob(
  AI_GENERATION_JOB,
  z.object({ runId: z.uuid() }).strict(),
  async (payload, context) => {
    if (!worker)
      throw new PermanentJobError(
        "AI_GENERATION_UNAVAILABLE",
        "AI generation Worker is not configured.",
      );
    return executeAiGeneration(
      worker.db,
      worker.runtime,
      payload.runId,
      context,
    );
  },
  {
    queue: {
      retryLimit: 3,
      retryDelay: 2,
      retryBackoff: true,
      expireInSeconds: 4 * 60,
    },
  },
);
