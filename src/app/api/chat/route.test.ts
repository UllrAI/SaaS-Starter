import { beforeEach, describe, expect, it } from "@jest/globals";
import { POST } from "./route";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  beginAiRun,
  AiRunConflictError,
  AiBudgetExceededError,
} from "@/lib/ai/runs";
import {
  requireAiConversation,
  AiConversationNotFoundError,
} from "@/lib/ai/chat-history";
import {
  requireOwnedAiImageAttachments,
  AiAttachmentValidationError,
} from "@/lib/ai/chat-attachments";
import { validateUIMessages } from "ai";
import { AiTranscriptConflictError } from "@/lib/ai/transcript";

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: jest.fn(),
}));
jest.mock("@/lib/rate-limit", () => ({ checkRateLimit: jest.fn() }));
jest.mock("@/lib/i18n/server-locale", () => ({
  getRequestLocale: async () => "zh-Hans",
}));
jest.mock("@/lib/ai/agents", () => ({
  isAgentId: (id: string) => id === "assistant",
}));
jest.mock("ai", () => ({
  ...jest.requireActual("ai"),
  validateUIMessages: jest.fn(),
}));
jest.mock("@/lib/ai/runs", () => ({
  ...jest.requireActual("@/lib/ai/run-repository"),
  beginAiRun: jest.fn(),
}));
jest.mock("@/lib/ai/chat-history", () => ({
  requireAiConversation: jest.fn(),
  AiConversationNotFoundError: class extends Error {},
}));
jest.mock("@/lib/ai/chat-attachments", () => ({
  requireOwnedAiImageAttachments: jest.fn(),
  AiAttachmentValidationError: class extends Error {},
}));
jest.mock("@/lib/config/site", () => ({
  SITE_CONFIG: { features: { ai: true } },
}));

const conversationId = "0192f26a-8c1f-7c2f-9ca9-5d3930d2fc75";
const requestId = "d465fa00-9330-4a81-b30c-f79149332dda";
const messages = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "hello" }] },
];
const run = {
  id: "run-1",
  conversationId,
  assistantMessageId: "a1",
  status: "queued",
};
const request = (
  body: unknown = { conversationId, requestId, messages },
  signal?: AbortSignal,
) => ({ headers: new Headers(), signal, json: async () => body }) as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(getAuthSessionFromHeaders)
    .mockResolvedValue({ user: { id: "user-1" } } as never);
  jest.mocked(checkRateLimit).mockResolvedValue({
    allowed: true,
    info: { resetAt: 2_000_000_000 },
  } as never);
  jest.mocked(requireAiConversation).mockResolvedValue();
  jest.mocked(requireOwnedAiImageAttachments).mockResolvedValue();
  jest
    .mocked(validateUIMessages)
    .mockImplementation(async ({ messages: incoming }) => incoming as never);
  jest
    .mocked(beginAiRun)
    .mockResolvedValue({ run, allowImageGeneration: true } as never);
});

describe("durable chat admission", () => {
  it("returns an accepted run and passes only authenticated identity to admission", async () => {
    const response = await POST(
      request({
        conversationId,
        requestId,
        messages,
        userId: "forged",
        reasoningEffort: "high",
      }),
    );
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ...run, runId: run.id });
    expect(beginAiRun).toHaveBeenCalledWith({
      userId: "user-1",
      conversationId,
      requestId,
      messages,
      parentMessageId: null,
      agentId: "assistant",
      reasoningEffort: "high",
      locale: "zh-Hans",
    });
  });

  it("browser abort does not cancel accepted background work", async () => {
    const abort = new AbortController();
    abort.abort();
    expect((await POST(request(undefined, abort.signal))).status).toBe(202);
    expect(beginAiRun).toHaveBeenCalledTimes(1);
  });

  it("returns the same accepted run on request retry", async () => {
    const first = await POST(request());
    const retried = await POST(request());
    expect(await retried.json()).toEqual(await first.json());
  });

  it.each([
    [new AiRunConflictError("Running"), 409, "ai_run_conflict"],
    [new AiTranscriptConflictError("Changed"), 409, "ai_conversation_changed"],
    [new AiBudgetExceededError("Budget"), 429, "ai_budget_reached"],
  ])("maps admission rejection %s", async (error, status, code) => {
    jest.mocked(beginAiRun).mockRejectedValueOnce(error);
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });

  it("rejects unowned conversations", async () => {
    jest
      .mocked(requireAiConversation)
      .mockRejectedValueOnce(new AiConversationNotFoundError());
    expect((await POST(request())).status).toBe(404);
    expect(beginAiRun).not.toHaveBeenCalled();
  });
  it("rejects unowned attachments before accepting work", async () => {
    jest
      .mocked(requireOwnedAiImageAttachments)
      .mockRejectedValueOnce(new AiAttachmentValidationError());
    expect((await POST(request())).status).toBe(400);
    expect(beginAiRun).not.toHaveBeenCalled();
  });
  it("rejects anonymous clients", async () => {
    jest.mocked(getAuthSessionFromHeaders).mockResolvedValueOnce(null);
    expect((await POST(request())).status).toBe(401);
    expect(beginAiRun).not.toHaveBeenCalled();
  });
  it("preserves rate limit response", async () => {
    jest.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      info: { resetAt: Math.ceil(Date.now() / 1000) + 20 },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
  });
  it.each([
    { messages: [] },
    { conversationId, requestId, messages, agentId: "ghost" },
  ])("rejects invalid request %j", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(beginAiRun).not.toHaveBeenCalled();
  });
  it("does not expose internal errors", async () => {
    jest.mocked(beginAiRun).mockRejectedValueOnce(new Error("secret"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret");
  });
});
