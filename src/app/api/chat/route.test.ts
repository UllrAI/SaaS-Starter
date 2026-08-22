import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockCreateAgent = jest.fn();
const mockCreateAgentUIStreamResponse = jest.fn();
const mockConsumeStream = jest.fn();
const mockValidateUIMessages = jest.fn();
const mockCreateResponseHandle = jest.fn();
const mockReadResponseHandle = jest.fn();
const mockRequireAiConversation = jest.fn();
const mockSaveAiMessages = jest.fn();
const mockPersistGeneratedImages = jest.fn();

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
  consumeStream: mockConsumeStream,
  createAgentUIStreamResponse: mockCreateAgentUIStreamResponse,
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
}));

jest.mock("@/lib/ai/generated-image-storage", () => ({
  persistGeneratedImages: mockPersistGeneratedImages,
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
      ? { conversationId, ...body }
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
    mockCreateResponseHandle.mockReturnValue("signed-response-handle");
    mockReadResponseHandle.mockReturnValue("resp_previous");
    mockRequireAiConversation.mockResolvedValue(undefined);
    mockSaveAiMessages.mockResolvedValue(undefined);
    mockPersistGeneratedImages.mockImplementation(
      ({ message }: { message: unknown }) => Promise.resolve(message),
    );
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
        userName: "Ada",
        userEmail: "ada@example.com",
        userRole: "user",
        locale: "zh-Hans",
      },
      {
        reasoningEffort: "low",
        imageSize: "1024x1024",
        previousResponseId: undefined,
      },
    );
    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      { agent: unknown; uiMessages: unknown; onError: (e: unknown) => string },
    ];
    expect(streamArgs.agent).toEqual({ id: "assistant-agent" });
    expect(streamArgs.uiMessages).toEqual(messages);
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
        previousResponseId: undefined,
      },
    );
  });

  it("passes a selected reasoning effort and verified response chain", async () => {
    const response = await postChat({
      messages,
      reasoningEffort: "high",
      responseHandle: "resp_previous.signature",
    });

    expect(response.status).toBe(200);
    expect(mockReadResponseHandle).toHaveBeenCalledWith(
      "resp_previous.signature",
      "user-1",
    );
    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      expect.objectContaining({ userId: "user-1" }),
      {
        reasoningEffort: "high",
        imageSize: "1024x1024",
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

  it("rejects an invalid response handle", async () => {
    mockReadResponseHandle.mockReturnValue(null);

    const response = await postChat({
      messages,
      responseHandle: "forged.signature",
    });

    expect(response.status).toBe(400);
    expect(mockCreateAgent).not.toHaveBeenCalled();
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

    expect(mockCreateResponseHandle).toHaveBeenCalledWith("resp_new", "user-1");
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

    expect(mockPersistGeneratedImages).toHaveBeenCalledWith({
      message: responseMessage,
      userId: "user-1",
    });
    expect(mockSaveAiMessages).toHaveBeenLastCalledWith({
      conversationId,
      userId: "user-1",
      messages: [responseMessage],
    });
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

  it("stores the user message before starting the provider stream", async () => {
    mockCreateAgentUIStreamResponse.mockRejectedValue(
      new Error("provider unavailable"),
    );

    const response = await postChat();

    expect(response.status).toBe(400);
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
