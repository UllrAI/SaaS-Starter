/** @jest-environment node */
import { expect, it } from "@jest/globals";
import {
  consumeStream,
  createAgentUIStreamResponse,
  isStepCount,
  tool,
  ToolLoopAgent,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { z } from "zod";
import { createAiUsageCollector } from "./usage";

it("captures completed-step usage through a real SDK abort while retaining partial output", async () => {
  const controller = new AbortController();
  let started!: () => void;
  const secondStep = new Promise<void>((resolve) => {
    started = resolve;
  });
  let calls = 0;
  const model = new MockLanguageModelV4({
    doStream: async ({ abortSignal }) => ({
      stream: new ReadableStream({
        start(stream) {
          stream.enqueue({ type: "stream-start", warnings: [] });
          if (calls++ === 0) {
            stream.enqueue({
              type: "tool-call",
              toolCallId: "time-1",
              toolName: "getTime",
              input: "{}",
            });
            stream.enqueue({
              type: "finish",
              finishReason: { unified: "tool-calls", raw: "tool_calls" },
              usage: {
                inputTokens: {
                  total: 10,
                  noCache: 10,
                  cacheRead: 0,
                  cacheWrite: undefined,
                },
                outputTokens: { total: 4, text: 4, reasoning: 0 },
              },
            });
            stream.close();
          } else {
            stream.enqueue({ type: "text-start", id: "text-1" });
            stream.enqueue({
              type: "text-delta",
              id: "text-1",
              delta: "Partial answer",
            });
            abortSignal?.addEventListener(
              "abort",
              () => stream.error(abortSignal.reason),
              { once: true },
            );
            started();
          }
        },
      }),
    }),
  });
  const agent = new ToolLoopAgent({
    model,
    tools: {
      getTime: tool({ inputSchema: z.object({}), execute: () => "now" }),
    },
    stopWhen: isStepCount(3),
  });
  const usage = createAiUsageCollector();
  let ended: { aborted: boolean; text: string } | undefined;
  const response = await createAgentUIStreamResponse({
    agent,
    uiMessages: [
      { id: "user-1", role: "user", parts: [{ type: "text", text: "time?" }] },
    ],
    abortSignal: controller.signal,
    consumeSseStream: ({ stream }) => consumeStream({ stream }),
    messageMetadata: ({ part }) => {
      usage.capture(part);
      return undefined;
    },
    onEnd: ({ isAborted, responseMessage }) => {
      ended = {
        aborted: isAborted,
        text: responseMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(""),
      };
    },
    onError: () => "Request interrupted.",
  });
  const read = response.text();
  await secondStep;
  // Let the emitted delta reach the UI stream before stopping the provider.
  await new Promise((resolve) => setTimeout(resolve, 10));
  controller.abort();
  await read;
  expect(ended).toEqual({ aborted: true, text: "Partial answer" });
  expect(usage.totals()).toMatchObject({
    inputTokens: 10,
    outputTokens: 4,
    totalTokens: 14,
    cacheWriteTokens: undefined,
  });
  expect(usage.isComplete()).toBe(false);
});
