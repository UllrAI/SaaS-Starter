import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockCreateAgent = jest.fn();
const mockCreateAgentUIStreamResponse = jest.fn();

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
  createAgentUIStreamResponse: mockCreateAgentUIStreamResponse,
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

function chatRequest(body: unknown) {
  return {
    headers: new Headers(),
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as never;
}

async function postChat(body: unknown = { messages }) {
  const { POST } = await import("./route");
  return POST(chatRequest(body));
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
    mockCreateAgentUIStreamResponse.mockResolvedValue(
      new Response("stream", { status: 200 }),
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
    expect(mockCreateAgent).toHaveBeenCalledWith("assistant", {
      userId: "user-1",
      userName: "Ada",
      userEmail: "ada@example.com",
      userRole: "user",
      locale: "zh-Hans",
    });
    const [streamArgs] = mockCreateAgentUIStreamResponse.mock.calls[0] as [
      { agent: unknown; uiMessages: unknown; onError: (e: unknown) => string },
    ];
    expect(streamArgs.agent).toEqual({ id: "assistant-agent" });
    expect(streamArgs.uiMessages).toEqual(messages);
  });

  it("defaults to the assistant agent when none is requested", async () => {
    await postChat({ messages });

    expect(mockCreateAgent).toHaveBeenCalledWith(
      "assistant",
      expect.objectContaining({ userId: "user-1" }),
    );
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
    mockCreateAgentUIStreamResponse.mockRejectedValue(
      new Error("invalid ui message"),
    );

    const response = await postChat();

    expect(response.status).toBe(400);
  });
});
