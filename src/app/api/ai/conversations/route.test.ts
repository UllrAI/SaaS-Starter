import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCheckRateLimit = jest.fn();
const mockCreateAiConversation = jest.fn();
const mockListAiConversations = jest.fn();

const siteConfig = {
  features: { emailAuth: true, billing: true, uploads: true, ai: true },
};

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mockCheckRateLimit,
}));
jest.mock("@/lib/ai/chat-history", () => ({
  createAiConversation: mockCreateAiConversation,
  listAiConversations: mockListAiConversations,
}));
jest.mock("@/lib/config/site", () => ({
  get SITE_CONFIG() {
    return siteConfig;
  },
}));

function request(search = "") {
  return new NextRequest(`http://localhost/api/ai/conversations${search}`);
}

describe("/api/ai/conversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    siteConfig.features.ai = true;
    mockGetAuthSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      info: { resetAt: 2_000_000_000 },
    });
    mockListAiConversations.mockResolvedValue({
      conversations: [],
      hasMore: false,
    });
    mockCreateAiConversation.mockResolvedValue({
      id: "conversation-1",
      title: null,
      createdAt: "2026-08-22T00:00:00.000Z",
      updatedAt: "2026-08-22T00:00:00.000Z",
    });
  });

  it("lists only the authenticated user's requested page", async () => {
    const { GET } = await import("./route");
    const response = await GET(request("?offset=30&limit=20"));

    expect(response.status).toBe(200);
    expect(mockListAiConversations).toHaveBeenCalledWith({
      userId: "user-1",
      offset: 30,
      limit: 20,
    });
  });

  it("creates a conversation for the authenticated user", async () => {
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(mockCreateAiConversation).toHaveBeenCalledWith("user-1");
    await expect(response.json()).resolves.toEqual({
      conversation: expect.objectContaining({ id: "conversation-1" }),
    });
  });

  it("rejects unauthenticated access", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);
    const { GET, POST } = await import("./route");

    expect((await GET(request())).status).toBe(401);
    expect((await POST(request())).status).toBe(401);
    expect(mockListAiConversations).not.toHaveBeenCalled();
    expect(mockCreateAiConversation).not.toHaveBeenCalled();
  });

  it("rejects invalid pagination", async () => {
    const { GET } = await import("./route");
    const response = await GET(request("?limit=1000"));

    expect(response.status).toBe(400);
    expect(mockListAiConversations).not.toHaveBeenCalled();
  });

  it("rate limits conversation creation", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      info: { resetAt: Math.ceil(Date.now() / 1000) + 10 },
    });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mockCreateAiConversation).not.toHaveBeenCalled();
  });
});
