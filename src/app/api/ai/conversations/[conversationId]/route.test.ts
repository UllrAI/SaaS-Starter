import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockGetAiConversation = jest.fn();
const mockSetAiConversationArchived = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/ai/chat-history", () => ({
  getAiConversation: mockGetAiConversation,
  setAiConversationArchived: mockSetAiConversationArchived,
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

function patchRequest(body: unknown) {
  return {
    headers: new Headers(),
    json: jest.fn<() => Promise<unknown>>().mockResolvedValue(body),
  } as never;
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
    mockSetAiConversationArchived.mockResolvedValue({
      id: conversationId,
      archivedAt: "2026-08-22T01:00:00.000Z",
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

  it("archives an owned conversation", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest({ archived: true }), context());

    expect(response.status).toBe(200);
    expect(mockSetAiConversationArchived).toHaveBeenCalledWith({
      conversationId,
      userId: "user-1",
      archived: true,
    });
  });

  it("does not reveal a missing conversation while archiving", async () => {
    mockSetAiConversationArchived.mockResolvedValue(null);
    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest({ archived: true }), context());

    expect(response.status).toBe(404);
  });

  it("rejects malformed archive requests", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(patchRequest({ archived: "yes" }), context());

    expect(response.status).toBe(400);
    expect(mockSetAiConversationArchived).not.toHaveBeenCalled();
  });

  it("rejects oversized archive requests", async () => {
    const { PATCH } = await import("./route");
    const response = await PATCH(
      patchRequest({ archived: true, padding: "x".repeat(1024) }),
      context(),
    );

    expect(response.status).toBe(413);
    expect(mockSetAiConversationArchived).not.toHaveBeenCalled();
  });
});
