import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockGetAiConversation = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/ai/chat-history", () => ({
  getAiConversation: mockGetAiConversation,
}));
jest.mock("@/lib/config/site", () => ({
  SITE_CONFIG: { features: { ai: true } },
}));

const conversationId = "0192f26a-8c1f-7c2f-9ca9-5d3930d2fc75";

function request() {
  return new NextRequest(
    `http://localhost/api/ai/conversations/${conversationId}`,
  );
}

function context(id = conversationId) {
  return { params: Promise.resolve({ conversationId: id }) };
}

describe("GET /api/ai/conversations/[conversationId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    mockGetAiConversation.mockResolvedValue({
      conversation: { id: conversationId },
      messages: [],
    });
  });

  it("loads an owned conversation", async () => {
    const { GET } = await import("./route");
    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mockGetAiConversation).toHaveBeenCalledWith({
      conversationId,
      userId: "user-1",
    });
  });

  it("does not reveal conversations that are missing or owned by another user", async () => {
    mockGetAiConversation.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(request(), context());

    expect(response.status).toBe(404);
  });

  it("rejects malformed conversation ids without querying storage", async () => {
    const { GET } = await import("./route");
    const response = await GET(request(), context("not-a-uuid"));

    expect(response.status).toBe(404);
    expect(mockGetAiConversation).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated access", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);
    const { GET } = await import("./route");
    const response = await GET(request(), context());

    expect(response.status).toBe(401);
    expect(mockGetAiConversation).not.toHaveBeenCalled();
  });
});
