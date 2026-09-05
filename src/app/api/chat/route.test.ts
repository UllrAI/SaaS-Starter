import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { InvalidToolApprovalSignatureError } from "ai";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockCreateAgent = jest.fn();
const mockCreateAgentUIStreamResponse = jest.fn();
const mockConsumeStream = jest.fn();
const mockGenerateId = jest.fn();
const mockValidateUIMessages = jest.fn();
const mockCreateResponseHandle = jest.fn();
const mockReadResponseHandle = jest.fn();
const mockRequireAiConversation = jest.fn();
const mockRequireOwnedAiImageAttachments = jest.fn();
const mockSaveAiMessages = jest.fn();
const mockFinalizeAiRun = jest.fn();
const mockCompleteAiRun = jest.fn();
const mockBeginAiRun = jest.fn();
const mockFailAiRun = jest.fn();
const mockGetAiConversation = jest.fn();
const mockExtractUsageTotals = jest.fn();

const siteConfig = {
  features: { emailAuth: true, billing: true, uploads: true, ai: true },
};

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));

jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));

jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: () => Promise.resolve("zh-Hans"),
}));

jest.mock("@/lib/config/site", () => ({
  get SITE_CONFIG() {
    return siteConfig;
  },
}));

jest.mock("@/lib/ai/agents", () => ({
  createAgent: mockCreateAgent,
  isAgentId: (value: string) => value === "assistant",
}));

jest.mock("ai", () => ({
  // The approval error classes are real: `route.ts` branches on `instanceof`,
  // so a stub would silently disable that branch instead of failing here.
  ...jest.requireActual<typeof import("ai")>("ai"),
  consumeStream: mockConsumeStream,
  createAgentUIStreamResponse: mockCreateAgentUIStreamResponse,
  generateId: mockGenerateId,
  validateUIMessages: mockValidateUIMessages,
}));

jest.mock("@/lib/ai/response-chain", () => ({
  createResponseHandle: mockCreateResponseHandle,
  readResponseHandle: mockReadResponseHandle,
}));

jest.mock("@/lib/ai/chat-history", () => ({
  AiConversationNotFoundError: class AiConversationNotFoundError extends Error {},
  requireAiConversation: mockRequireAiConversation,
  saveAiMessages: mockSaveAiMessages,
  getAiConversation: mockGetAiConversation,
}));

jest.mock("@/lib/ai/chat-attachments", () => ({
  AiAttachmentValidationError: class AiAttachmentValidationError extends Error {},
  requireOwnedAiImageAttachments: mockRequireOwnedAiImageAttachments,
  resolveAiImageAttachments: async (messages: unknown) => messages,
}));

jest.mock("@/lib/uploads/server-storage", () => ({ storeFile: jest.fn() }));
jest.mock("@/lib/ai/finalize", () => ({ finalizeAiRun: mockFinalizeAiRun }));
jest.mock("@/lib/ai/runs", () => ({
  beginAiRun: mockBeginAiRun,
  completeAiRun: mockCompleteAiRun,
  failAiRun: mockFailAiRun,
  AiRunConflictError: class AiRunConflictError extends Error {},
  AiBudgetExceededError: class AiBudgetExceededError extends Error {},
}));

jest.mock("@/lib/ai/usage", () => ({
  AI_MODEL_UNREPORTED: "unreported",
  extractUsageTotals: mockExtractUsageTotals,
}));

const session = {
  user: {
    id: "user-1",
    name: "Ada",
    email: "ada@example.com",
    role: "user",
  },
};

const messages = [
  { id: "m1", role: "user", parts: [{ type: "text", text: "hi" }] },
];
const conversationId = "0192f26a-8c1f-7c2f-9ca9-5d3930d2fc75";

function chatRequest(body: unknown) {
  return {
    headers: new Headers(),
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as never;
}

async function postChat(body: unknown = { messages, conversationId }) {
  const { POST } = await import("./route");
  const normalizedBody =
    body && typeof body === "object" && "messages" in body
      ? {
          conversationId,
          requestId: "d465fa00-9330-4a81-b30c-f79149332dda",
          ...body,
        }
      : body;
  return POST(chatRequest(normalizedBody));
}

describe("/api/chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    siteConfig.features.ai = true;
    mockGetAuthSessionFromHeaders.mockResolvedValue(session);
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: { limit: 30, remaining: 29, resetAt: 2_000_000_000 },
    });
    mockCreateAgent.mockReturnValue({ id: "assistant-agent" });
    mockConsumeStream.mockResolvedValue(undefined);
    mockGenerateId.mockReturnValue("assistant-message-1");
    mockCreateResponseHandle.mockReturnValue("signed-response-handle");
    mockReadResponseHandle.mockReturnValue("resp_previous");
    mockRequireAiConversation.mockResolvedValue(undefined);
    mockRequireOwnedAiImageAttachments.mockResolvedValue(undefined);
    mockSaveAiMessages.mockResolvedValue(undefined);
    mockGetAiConversation.mockResolvedValue({ messages: [] });
    mockBeginAiRun.mockResolvedValue({
      run: { id: "run-1" },
      allowImageGeneration: true,
    });
    mockCompleteAiRun.mockResolvedValue(undefined);
    mockFinalizeAiRun.mockResolvedValue(undefined);
    mockFailAiRun.mockResolvedValue(undefined);
    mockExtractUsageTotals.mockReturnValue({
      inputTokens: 11,
      outputTokens: 22,
      totalTokens: 33,
    });
    mockCreateAgentUIStreamResponse.mockResolvedValue(
      new Response("stream", { status: 200 }),
    );
    mockValidateUIMessages.mockImplementation(
      ({ messages: inputMessages }: { messages: unknown }) =>
        Promise.resolve(inputMessages),
    );
  });

  it("hides the route when the AI feature is disabled", async () => {
    siteConfig.features.ai = false;

    const response = await postChat();

    expect(response.status).toBe(404);
    expect(mockGetAuthSessionFromHeaders).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests before doing any work", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);

    const response = await postChat();

    expect(response.status).toBe(401);
    expect(mockCheckRateLimit).not.toHaveBeenCalled();
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when the user is rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: {
        limit: 30,
        remaining: 0,
        resetAt: Math.ceil(Date.now() / 1000) + 42,
      },
    });

    const response = await postChat();

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mockCreateAgentUIStreamResponse).not.toHaveBeenCalled();
  });

  it("rejects an empty message list", async () => {
    const response = await postChat({ messages: [] });

    expect(response.status).toBe(400);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("rejects an unknown agent id", async () => {
    const response = await postChat({ messages, agentId: "ghost" });

    expect(response.status).toBe(400);
    expect(mockCreateAgent).not.toHaveBeenCalled();
  });

  it("streams the agent response and builds context from the session only", async () => {
    const response = await postChat({
      messages,
      agentId: "assistant",
      // A client must never be able to impersonate another user.
      userId: "attacker",
    });

    expect(response.status).toBe(200);
    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      {
        userId: "user-1",
        conversationId,
        userName: "Ada",
        userEmail: "ada@example.com",
        userRole: "user",
        locale: "zh-Hans",
      },
      {
        reasoningEffort: "low",
        imageSize: "1024x1024",
        allowImageGeneration: true,
        previousResponseId: undefined,
      },
    );
    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      { agent: unknown; uiMessages: unknown; onError: (e: unknown) => string },
    ];
    expect(streamArgs.agent).toEqual({ id: "assistant-agent" });
    expect(streamArgs.uiMessages).toEqual(messages);
    expect(streamArgs).toEqual(
      expect.objectContaining({ generateMessageId: mockGenerateId }),
    );
    expect(mockRequireAiConversation).toHaveBeenCalledWith({
      conversationId,
      userId: "user-1",
    });
    expect(mockSaveAiMessages).toHaveBeenCalledWith({
      conversationId,
      userId: "user-1",
      messages,
    });
  });

  it("defaults to the assistant agent when none is requested", async () => {
    await postChat({ messages });

    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      expect.objectContaining({ userId: "user-1" }),
      {
        reasoningEffort: "low",
        imageSize: "1024x1024",
        allowImageGeneration: true,
        previousResponseId: undefined,
      },
    );
  });

  it("passes a selected reasoning effort and verified response chain", async () => {
    mockGetAiConversation.mockResolvedValue({
      messages: [
        {
          id: "a0",
          role: "assistant",
          parts: [],
          metadata: { responseHandle: "resp_previous.signature" },
        },
      ],
    });
    const response = await postChat({
      messages,
      reasoningEffort: "high",
      parentMessageId: "a0",
      responseHandle: "resp_previous.signature",
    });

    expect(response.status).toBe(200);
    expect(mockReadResponseHandle).toHaveBeenCalledWith(
      "resp_previous.signature",
      "user-1",
      conversationId,
    );
    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      expect.objectContaining({ userId: "user-1" }),
      {
        reasoningEffort: "high",
        imageSize: "1024x1024",
        allowImageGeneration: true,
        previousResponseId: "resp_previous",
      },
    );
  });

  it("selects a 1K landscape image size from the latest request", async () => {
    await postChat({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "生成一张横版产品图" }],
        },
      ],
    });

    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      expect.objectContaining({ userId: "user-1" }),
      expect.objectContaining({ imageSize: "1536x1024" }),
    );
  });

  it("ignores client supplied response handles", async () => {
    mockReadResponseHandle.mockReturnValue(null);

    const response = await postChat({
      messages,
      responseHandle: "forged.signature",
    });

    expect(response.status).toBe(200);
    expect(mockReadResponseHandle).not.toHaveBeenCalled();
  });

  it("signs the Responses API id into assistant message metadata", async () => {
    await postChat({ messages });

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        messageMetadata: (options: {
          part: { type: string; response?: { id: string } };
        }) => unknown;
      },
    ];
    const metadata = streamArgs.messageMetadata({
      part: { type: "finish-step", response: { id: "resp_new" } },
    });

    expect(mockCreateResponseHandle).toHaveBeenCalledWith(
      "resp_new",
      "user-1",
      conversationId,
    );
    expect(metadata).toEqual({ responseHandle: "signed-response-handle" });
  });

  it("stores the completed assistant message and generated assets", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        onEnd: (options: { responseMessage: unknown }) => Promise<void>;
      },
    ];
    const responseMessage = {
      id: "assistant-1",
      role: "assistant",
      parts: [{ type: "text", text: "Hello" }],
    };
    await streamArgs.onEnd({ responseMessage });

    expect(mockCompleteAiRun).toHaveBeenCalledWith(
      "run-1",
      responseMessage,
      expect.objectContaining({ userId: "user-1" }),
    );
    expect(mockFinalizeAiRun).toHaveBeenCalled();
    expect(mockCompleteAiRun.mock.invocationCallOrder[0]).toBeLessThan(
      mockFinalizeAiRun.mock.invocationCallOrder[0],
    );
  });

  it("records token usage for a completed turn", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        messageMetadata: (options: { part: unknown }) => unknown;
        onEnd: (options: {
          responseMessage: unknown;
          finishReason: string;
        }) => Promise<void>;
      },
    ];
    const totalUsage = { inputTokens: 11, outputTokens: 22, totalTokens: 33 };

    // The model is reported per step, the totals only on the final part.
    streamArgs.messageMetadata({
      part: {
        type: "finish-step",
        response: { id: "resp_new", modelId: "gpt-5.6-luna" },
      },
    });
    streamArgs.messageMetadata({ part: { type: "finish", totalUsage } });
    await streamArgs.onEnd({
      responseMessage: { id: "assistant-1", role: "assistant", parts: [] },
      finishReason: "stop",
    });

    expect(mockExtractUsageTotals).toHaveBeenCalledWith(totalUsage);
    expect(mockCompleteAiRun).toHaveBeenCalledWith(
      "run-1",
      expect.any(Object),
      expect.objectContaining({
        userId: "user-1",
        conversationId,
        messageId: "assistant-1",
        agentId: "assistant",
        model: "gpt-5.6-luna",
        reasoningEffort: "low",
        finishReason: "stop",
        inputTokens: 11,
        outputTokens: 22,
        totalTokens: 33,
      }),
    );
  });

  it("falls back to a sentinel when the provider reports no model", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        onEnd: (options: {
          responseMessage: unknown;
          finishReason: string;
        }) => Promise<void>;
      },
    ];
    // Unattributable spend must stay visible in aggregates, not vanish.
    await streamArgs.onEnd({
      responseMessage: { id: "assistant-1", role: "assistant", parts: [] },
      finishReason: "stop",
    });

    expect(mockCompleteAiRun).toHaveBeenCalledWith(
      "run-1",
      expect.any(Object),
      expect.objectContaining({ model: "unreported" }),
    );
  });

  it("keeps the durable response when media finalization fails", async () => {
    mockFinalizeAiRun.mockRejectedValue(new Error("R2 unavailable"));
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        onEnd: (options: {
          responseMessage: unknown;
          finishReason: string;
        }) => Promise<void>;
      },
    ];

    await expect(
      streamArgs.onEnd({
        responseMessage: { id: "assistant-1", role: "assistant", parts: [] },
        finishReason: "stop",
      }),
    ).resolves.toBeUndefined();
    expect(mockSaveAiMessages).toHaveBeenCalled();
  });

  it("keeps consuming the response when the browser disconnects", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      {
        consumeSseStream: (options: {
          stream: ReadableStream<string>;
        }) => Promise<void>;
      },
    ];
    const stream = new ReadableStream<string>();

    await streamArgs.consumeSseStream({ stream });

    expect(mockConsumeStream).toHaveBeenCalledWith({
      stream,
      onError: expect.any(Function),
    });
  });

  it("masks provider errors surfaced through the stream", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      { onError: (error: unknown) => string },
    ];
    const message = streamArgs.onError(new Error("upstream 401: sk-secret"));

    expect(message).not.toContain("sk-secret");
    expect(message).toBeTruthy();
  });

  it("reports a forged tool approval without explaining the check", async () => {
    await postChat();

    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      { onError: (error: unknown) => string },
    ];
    const message = streamArgs.onError(
      new InvalidToolApprovalSignatureError({
        approvalId: "approval-1",
        toolCallId: "call-1",
        reason: "signature mismatch",
      }),
    );

    expect(message).toBe(
      "That approval could not be verified. Please send the request again.",
    );
  });

  it("returns 500 when the agent cannot be constructed", async () => {
    mockCreateAgent.mockImplementation(() => {
      throw new Error("missing model configuration");
    });

    const response = await postChat();
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(payload.error).not.toContain("missing model configuration");
  });

  it("returns 400 when the UI messages are rejected before streaming", async () => {
    mockValidateUIMessages.mockRejectedValue(new Error("invalid ui message"));

    const response = await postChat();

    expect(response.status).toBe(400);
    expect(mockCreateAgentUIStreamResponse).not.toHaveBeenCalled();
  });

  it("rejects image attachments that are not owned by the current user", async () => {
    const { AiAttachmentValidationError } =
      await import("@/lib/ai/chat-attachments");
    mockRequireOwnedAiImageAttachments.mockRejectedValue(
      new AiAttachmentValidationError(),
    );

    const response = await postChat({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [
            {
              type: "file",
              mediaType: "image/png",
              url: "https://example.com/not-owned.png",
            },
          ],
        },
      ],
    });

    expect(response.status).toBe(400);
    expect(mockCreateAgent).not.toHaveBeenCalled();
    expect(mockSaveAiMessages).not.toHaveBeenCalled();
  });

  it("stores the user message before starting the provider stream", async () => {
    mockCreateAgentUIStreamResponse.mockRejectedValue(
      new Error("provider unavailable"),
    );

    const response = await postChat();

    expect(response.status).toBe(500);
    expect(mockSaveAiMessages).toHaveBeenCalledWith({
      conversationId,
      userId: "user-1",
      messages,
    });
  });

  it("does not call the provider when message persistence fails", async () => {
    mockSaveAiMessages.mockRejectedValue(new Error("database unavailable"));

    const response = await postChat();

    expect(response.status).toBe(500);
    expect(mockCreateAgentUIStreamResponse).not.toHaveBeenCalled();
  });
});
