/** @jest-environment node */
import { describe, expect, it } from "@jest/globals";
import type { UIMessageChunk } from "ai";
import { Chat } from "@ai-sdk/react";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { DurableChatTransport } from "./durable-chat-transport";
import { restoreRetryMessages } from "./chat-retry";

function events(
  chunks: Array<{ id: number; chunk: UIMessageChunk }>,
  done = true,
) {
  return new Response(
    chunks
      .map(({ id, chunk }) => `id: ${id}\ndata: ${JSON.stringify(chunk)}\n\n`)
      .join("") + (done ? "data: [DONE]\n\n" : ""),
  );
}

async function collect(stream: ReadableStream<UIMessageChunk>) {
  const chunks: UIMessageChunk[] = [];
  const reader = stream.getReader();
  for (;;) {
    const item = await reader.read();
    if (item.done) return chunks;
    chunks.push(item.value);
  }
}

const options = {
  chatId: "chat-1",
  messages: [
    {
      id: "user-1",
      role: "user" as const,
      parts: [{ type: "text" as const, text: "Hello" }],
    },
  ],
  trigger: "submit-message" as const,
  messageId: undefined,
  abortSignal: undefined,
  body: { conversationId: "conversation-1", reasoningEffort: "low" },
};

describe("durable chat transport", () => {
  it("resumes a truncated stream from the last durable cursor without duplicating events", async () => {
    const start: UIMessageChunk = { type: "start", messageId: "assistant-1" };
    const textStart: UIMessageChunk = { type: "text-start", id: "text-1" };
    const delta: UIMessageChunk = {
      type: "text-delta",
      id: "text-1",
      delta: "Hello",
    };
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ runId: "run-1" }, { status: 202 }))
      .mockResolvedValueOnce(
        events(
          [
            { id: 1, chunk: start },
            { id: 2, chunk: textStart },
          ],
          false,
        ),
      )
      .mockResolvedValueOnce(
        events([
          { id: 2, chunk: textStart },
          { id: 3, chunk: delta },
          { id: 4, chunk: { type: "text-end", id: "text-1" } },
          { id: 5, chunk: { type: "finish" } },
        ]),
      );
    const transport = new DurableChatTransport({ fetch: request });
    const received = await collect(await transport.sendMessages(options));
    expect(received).toEqual([
      start,
      textStart,
      delta,
      { type: "text-end", id: "text-1" },
      { type: "finish" },
    ]);
    expect(request.mock.calls[2][0]).toBe("/api/ai/runs/run-1/stream?cursor=2");
    expect(
      request.mock.calls.filter(([url]) => url === "/api/chat"),
    ).toHaveLength(1);
  });

  it("retries a transient proxy error while retaining the durable SSE cursor", async () => {
    const start: UIMessageChunk = { type: "start", messageId: "assistant-1" };
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ runId: "run-1" }, { status: 202 }))
      .mockResolvedValueOnce(events([{ id: 1, chunk: start }], false))
      .mockResolvedValueOnce(
        new Response("Temporary proxy failure", { status: 502 }),
      )
      .mockResolvedValueOnce(events([{ id: 2, chunk: { type: "finish" } }]));
    const transport = new DurableChatTransport({ fetch: request });
    expect(await collect(await transport.sendMessages(options))).toEqual([
      start,
      { type: "finish" },
    ]);
    expect(request.mock.calls[2][0]).toBe("/api/ai/runs/run-1/stream?cursor=1");
    expect(request.mock.calls[3][0]).toBe("/api/ai/runs/run-1/stream?cursor=1");
  });

  it.each([401, 403, 404, 409, 429])(
    "fails a durable subscription with HTTP %s without retrying",
    async (status) => {
      const request = jest
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          Response.json({ runId: "run-1" }, { status: 202 }),
        )
        .mockResolvedValueOnce(
          new Response("Subscription refused", { status }),
        );
      const transport = new DurableChatTransport({ fetch: request });
      await expect(
        collect(await transport.sendMessages(options)),
      ).rejects.toThrow("Subscription refused");
      expect(request.mock.calls).toHaveLength(2);
    },
  );

  it("retries an ambiguous admission with the same idempotency key", async () => {
    const request = jest
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError("Network disconnected"))
      .mockResolvedValueOnce(Response.json({ runId: "run-1" }, { status: 202 }))
      .mockResolvedValueOnce(
        events([
          { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
          { id: 2, chunk: { type: "finish" } },
        ]),
      );
    const transport = new DurableChatTransport({ fetch: request });
    await collect(await transport.sendMessages(options));
    expect(request.mock.calls[0][1]?.body).toBe(request.mock.calls[1][1]?.body);
  });

  it("retries when admission headers arrive but its body disconnects, retaining the same request ID", async () => {
    const truncated = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"runId":'));
          controller.error(new TypeError("Response connection lost"));
        },
      }),
      { status: 202 },
    );
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(truncated)
      .mockResolvedValueOnce(Response.json({ runId: "run-1" }, { status: 202 }))
      .mockResolvedValueOnce(
        events([
          { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
          { id: 2, chunk: { type: "finish" } },
        ]),
      );
    const transport = new DurableChatTransport({ fetch: request });
    await collect(await transport.sendMessages(options));
    expect(request.mock.calls[0][1]?.body).toBe(request.mock.calls[1][1]?.body);
    expect(
      request.mock.calls.filter(([url]) => url === "/api/chat"),
    ).toHaveLength(2);
  });

  it("clears a rejected acceptance before a later cancel", async () => {
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ code: "ai_run_conflict" }, { status: 409 }),
      );
    const transport = new DurableChatTransport({ fetch: request });
    await expect(transport.sendMessages(options)).rejects.toThrow(
      "ai_run_conflict",
    );
    await expect(transport.cancel()).resolves.toBeUndefined();
    expect(request.mock.calls).toHaveLength(1);
  });

  it("uses the accepted run for normal SDK regeneration instead of resending an outdated transcript", async () => {
    const summary = {
      runId: "run-1",
      conversationId: "conversation-1",
      assistantMessageId: "assistant-1",
      status: "queued",
    };
    const answer = (text: string) =>
      events([
        { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
        { id: 2, chunk: { type: "text-start", id: "text-1" } },
        { id: 3, chunk: { type: "text-delta", id: "text-1", delta: text } },
        { id: 4, chunk: { type: "text-end", id: "text-1" } },
        { id: 5, chunk: { type: "finish" } },
      ]);
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json(summary, { status: 202 }))
      .mockResolvedValueOnce(answer("First answer"))
      .mockResolvedValueOnce(
        Response.json({ ...summary, runId: "run-2" }, { status: 202 }),
      )
      .mockResolvedValueOnce(answer("Fresh answer"));
    const chat = new Chat<AiMessage>({
      messages: options.messages,
      transport: new DurableChatTransport({ fetch: request }),
    });
    await chat.sendMessage(undefined, { body: options.body });
    await chat.regenerate({ body: options.body });
    expect(JSON.parse(String(request.mock.calls[2][1]?.body))).toMatchObject({
      retryRunId: "run-1",
      requestId: expect.any(String),
      conversationId: "conversation-1",
    });
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1].parts).toEqual([
      { type: "text", text: "Fresh answer", state: "done" },
    ]);
  });

  it("manually retries failed approval output from the original signed input", async () => {
    const retryMessage: AiMessage = {
      id: "assistant-1",
      role: "assistant",
      parts: [
        {
          type: "tool-saveDocument",
          toolCallId: "tool-1",
          state: "approval-responded",
          input: { fileName: "plan.md", content: "# Plan" },
          approval: { id: "approval-1", approved: true, signature: "signed" },
        },
      ],
    };
    const partial: AiMessage = {
      id: "assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "Partial" }],
    };
    const request = jest
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ runId: "retry-1" }, { status: 202 }),
      )
      .mockResolvedValueOnce(
        events([
          { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
          {
            id: 2,
            chunk: {
              type: "tool-output-available",
              toolCallId: "tool-1",
              output: { fileName: "plan.md" },
            },
          },
          { id: 3, chunk: { type: "finish" } },
        ]),
      );
    const chat = new Chat<AiMessage>({
      messages: restoreRetryMessages(
        [options.messages[0], partial],
        retryMessage,
        "assistant-1",
      ),
      transport: new DurableChatTransport({ fetch: request }),
    });
    await chat.sendMessage(undefined, {
      body: { conversationId: "conversation-1", retryRunId: "failed-1" },
    });
    expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toEqual({
      conversationId: "conversation-1",
      retryRunId: "failed-1",
      requestId: expect.any(String),
    });
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1].parts[0]).toMatchObject({
      state: "output-available",
      input: { fileName: "plan.md", content: "# Plan" },
      output: { fileName: "plan.md" },
    });
    expect(chat.messages[1].parts.some((part) => part.type === "text")).toBe(
      false,
    );
  });

  it("restores an accepted run without submitting another model request", async () => {
    const request = jest.fn<typeof fetch>().mockResolvedValue(
      events([
        { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
        { id: 2, chunk: { type: "finish" } },
      ]),
    );
    const transport = new DurableChatTransport({ fetch: request });
    await collect(
      await transport.sendMessages({
        ...options,
        body: { resumeRunId: "run-1" },
      }),
    );
    expect(request.mock.calls).toHaveLength(1);
    expect(request.mock.calls[0][0]).toBe("/api/ai/runs/run-1/stream?cursor=0");
  });

  it("restores an approval continuation through the SDK without losing its existing tool input", async () => {
    const paused: AiMessage = {
      id: "assistant-1",
      role: "assistant",
      metadata: { responseHandle: "signed-response" },
      parts: [
        {
          type: "tool-saveDocument",
          toolCallId: "tool-1",
          state: "approval-responded",
          input: { fileName: "plan.md", content: "# Plan" },
          approval: { id: "approval-1", approved: true },
        },
      ],
    };
    const request = jest.fn<typeof fetch>().mockResolvedValue(
      events([
        { id: 1, chunk: { type: "start", messageId: "assistant-1" } },
        {
          id: 2,
          chunk: {
            type: "tool-output-available",
            toolCallId: "tool-1",
            output: { fileName: "plan.md" },
          },
        },
        { id: 3, chunk: { type: "finish" } },
      ]),
    );
    const chat = new Chat<AiMessage>({
      messages: [options.messages[0], paused],
      transport: new DurableChatTransport({ fetch: request }),
    });
    await chat.sendMessage(undefined, { body: { resumeRunId: "run-1" } });
    expect(chat.messages).toHaveLength(2);
    expect(chat.messages[1].parts[0]).toMatchObject({
      type: "tool-saveDocument",
      state: "output-available",
      input: { fileName: "plan.md", content: "# Plan" },
      output: { fileName: "plan.md" },
    });
  });

  it("disconnects the browser stream without calling the cancel endpoint", async () => {
    const request = jest
      .fn<typeof fetch>()
      .mockImplementation(async (url, init) => {
        if (url === "/api/chat")
          return Response.json({ runId: "run-1" }, { status: 202 });
        return new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener(
                "abort",
                () => controller.error(init.signal?.reason),
                { once: true },
              );
            },
          }),
        );
      });
    const transport = new DurableChatTransport({ fetch: request });
    const result = collect(await transport.sendMessages(options));
    transport.disconnect();
    await expect(result).rejects.toMatchObject({ name: "AbortError" });
    expect(
      request.mock.calls.every(([url]) => !String(url).endsWith("/cancel")),
    ).toBe(true);
  });

  it("waits for admission before sending an explicit cancellation", async () => {
    let accepted!: (response: Response) => void;
    const request = jest
      .fn<typeof fetch>()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            accepted = resolve;
          }),
      )
      .mockResolvedValueOnce(Response.json({ status: "aborted" }))
      .mockResolvedValue(events([{ id: 1, chunk: { type: "abort" } }]));
    const transport = new DurableChatTransport({ fetch: request });
    const sent = transport.sendMessages(options);
    const cancelled = transport.cancel();
    accepted(Response.json({ runId: "run-1" }, { status: 202 }));
    await cancelled;
    await collect(await sent);
    expect(
      request.mock.calls.some(([url]) => url === "/api/ai/runs/run-1/cancel"),
    ).toBe(true);
  });
});
