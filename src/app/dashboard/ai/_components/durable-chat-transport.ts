import { DefaultChatTransport, type ChatTransport } from "ai";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
} from "@/lib/ai/reasoning";
import { prepareChatRequest } from "./chat-request";
import type { AiRunSummary } from "@/lib/ai/durable-types";

const TRANSIENT_HTTP_STATUSES = new Set([500, 502, 503, 504]);

interface TransportOptions {
  fetch?: typeof fetch;
  onReconnecting?: (reconnecting: boolean) => void;
  onRunAccepted?: (run: AiRunSummary) => void;
}

function waitForRetry(signal: AbortSignal, attempt: number) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(
      () => {
        signal.removeEventListener("abort", abort);
        resolve();
      },
      Math.min(500 * 2 ** Math.min(attempt, 4), 5_000),
    );
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** Keeps one SDK stream alive while its durable SSE connection reconnects. */
export class DurableChatTransport extends DefaultChatTransport<AiMessage> {
  private connection?: AbortController;
  private runId?: string;
  private acceptance?: Promise<AiRunSummary>;
  private latestAcceptedRun?: AiRunSummary;
  private readonly onRunAccepted: (run: AiRunSummary) => void;
  private readonly request: typeof fetch;
  private readonly onReconnecting: (value: boolean) => void;

  constructor(options: TransportOptions = {}) {
    super();
    this.request = options.fetch ?? ((...args) => fetch(...args));
    this.onReconnecting = options.onReconnecting ?? (() => {});
    this.onRunAccepted = options.onRunAccepted ?? (() => {});
  }

  get currentRunId() {
    return this.runId;
  }

  disconnect() {
    this.connection?.abort();
    this.onReconnecting(false);
  }

  async cancel() {
    const runId = this.runId ?? (await this.acceptance)?.runId;
    if (!runId) return;
    const response = await this.request(
      `/api/ai/runs/${encodeURIComponent(runId)}/cancel`,
      { method: "POST" },
    );
    if (!response.ok) throw new Error(await response.text());
  }

  override async sendMessages(
    options: Parameters<ChatTransport<AiMessage>["sendMessages"]>[0],
  ) {
    this.disconnect();
    this.runId = undefined;
    const connection = new AbortController();
    this.connection = connection;
    const signal = options.abortSignal
      ? AbortSignal.any([options.abortSignal, connection.signal])
      : connection.signal;
    const body = options.body as
      | {
          conversationId?: string;
          reasoningEffort?: unknown;
          resumeRunId?: string;
          retryRunId?: string;
        }
      | undefined;
    let runId = body?.resumeRunId;
    if (!runId) {
      if (!body?.conversationId) throw new Error("A conversation is required.");
      const reasoningEffort =
        REASONING_EFFORTS.find((effort) => effort === body.reasoningEffort) ??
        DEFAULT_REASONING_EFFORT;
      // Retries reuse the same request ID, including an ambiguous lost response.
      const retryRunId =
        body.retryRunId ??
        (options.trigger === "regenerate-message" &&
        this.latestAcceptedRun?.conversationId === body.conversationId
          ? this.latestAcceptedRun.runId
          : undefined);
      this.latestAcceptedRun = undefined;
      const requestBody = JSON.stringify(
        retryRunId
          ? {
              requestId: crypto.randomUUID(),
              conversationId: body.conversationId,
              retryRunId,
            }
          : prepareChatRequest({
              messages: options.messages,
              conversationId: body.conversationId,
              reasoningEffort,
            }),
      );
      this.acceptance = this.retryRequest(
        "/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
          signal,
        },
        async (response) => response.json() as Promise<AiRunSummary>,
      );
      try {
        const accepted = await this.acceptance;
        this.latestAcceptedRun = accepted;
        this.onRunAccepted(accepted);
        runId = accepted.runId;
      } finally {
        this.acceptance = undefined;
      }
    }
    this.runId = runId;
    this.acceptance = undefined;
    return this.processResponseStream(this.readRunEvents(runId, signal));
  }

  private async retryRequest<T>(
    url: string,
    init: RequestInit & { signal: AbortSignal },
    read: (response: Response) => Promise<T>,
  ) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        const response = await this.request(url, init);
        if (TRANSIENT_HTTP_STATUSES.has(response.status)) {
          await response.body?.cancel();
          this.onReconnecting(true);
          await waitForRetry(init.signal, attempt);
          continue;
        }
        if (!response.ok) throw new Error(await response.text());
        const result = await read(response);
        this.onReconnecting(false);
        return result;
      } catch (error) {
        init.signal.throwIfAborted();
        if (!(error instanceof TypeError)) throw error;
        this.onReconnecting(true);
        await waitForRetry(init.signal, attempt);
      }
    }
  }

  private readRunEvents(runId: string, signal: AbortSignal) {
    const requestAbort = new AbortController();
    const streamSignal = AbortSignal.any([signal, requestAbort.signal]);
    const encoder = new TextEncoder();
    let cursor = 0;
    return new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          for (let attempt = 0; ; attempt += 1) {
            streamSignal.throwIfAborted();
            try {
              const response = await this.retryRequest(
                `/api/ai/runs/${encodeURIComponent(runId)}/stream?cursor=${cursor}`,
                { signal: streamSignal, cache: "no-store" },
                async (response) => response,
              );
              if (!response.body)
                throw new Error("The response body is empty.");
              const reader = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();
              let buffered = "";
              try {
                for (;;) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffered += value.replace(/\r\n/g, "\n");
                  let boundary: number;
                  while ((boundary = buffered.indexOf("\n\n")) >= 0) {
                    const frame = buffered.slice(0, boundary);
                    buffered = buffered.slice(boundary + 2);
                    const lines = frame.split("\n");
                    const data = lines
                      .filter((line) => line.startsWith("data:"))
                      .map((line) => line.slice(5).trimStart())
                      .join("\n");
                    if (!data) continue;
                    if (data === "[DONE]") {
                      controller.close();
                      this.onReconnecting(false);
                      return;
                    }
                    const id = Number(
                      lines
                        .find((line) => line.startsWith("id:"))
                        ?.slice(3)
                        .trim(),
                    );
                    if (!Number.isSafeInteger(id) || id <= 0)
                      throw new Error("Invalid run event cursor.");
                    if (id <= cursor) continue;
                    if (id !== cursor + 1)
                      throw new Error("Missing run event.");
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    cursor = id;
                    attempt = 0;
                  }
                }
              } finally {
                await reader.cancel().catch(() => {});
                reader.releaseLock();
              }
            } catch (error) {
              streamSignal.throwIfAborted();
              if (!(error instanceof TypeError)) throw error;
            }
            this.onReconnecting(true);
            await waitForRetry(streamSignal, attempt);
          }
        } catch (error) {
          this.onReconnecting(false);
          controller.error(error);
        }
      },
      cancel: () => requestAbort.abort(),
    });
  }
}
