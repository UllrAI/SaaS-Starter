import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  transaction: jest.fn(),
};

const mockAiConversations = {
  id: "aiConversations.id",
  userId: "aiConversations.userId",
  title: "aiConversations.title",
  archivedAt: "aiConversations.archivedAt",
  updatedAt: { desc: jest.fn() },
};
const mockAiMessages = {
  id: "aiMessages.id",
  conversationId: "aiMessages.conversationId",
  createdAt: "aiMessages.createdAt",
};

const mockSql = jest.fn(
  (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
  }),
);
const mockIsNotNull = jest.fn((value: unknown) => ["isNotNull", value]);
const mockIsNull = jest.fn((value: unknown) => ["isNull", value]);

jest.mock("@/database", () => ({ db: mockDb }));
jest.mock("@/database/schema", () => ({
  aiConversations: mockAiConversations,
  aiMessages: mockAiMessages,
}));
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...values: unknown[]) => values),
  asc: jest.fn((value: unknown) => value),
  desc: jest.fn((value: unknown) => value),
  eq: jest.fn((column: unknown, value: unknown) => [column, value]),
  isNotNull: mockIsNotNull,
  isNull: mockIsNull,
  sql: mockSql,
}));

const now = new Date("2026-08-22T00:00:00.000Z");
const conversation = {
  id: "conversation-1",
  userId: "user-1",
  title: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
};

function ownedConversationQuery(result = [conversation]) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(result),
      }),
    }),
  };
}

describe("AI chat history storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSql.mockImplementation(
      (strings: TemplateStringsArray, ...values: unknown[]) => ({
        strings,
        values,
      }),
    );
  });

  it("creates user-owned conversations and serializes timestamps", async () => {
    const returning = jest.fn().mockResolvedValue([conversation]);
    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({ returning }),
    });
    const { createAiConversation } = await import("./chat-history");

    await expect(createAiConversation("user-1")).resolves.toEqual({
      id: "conversation-1",
      title: null,
      archivedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  });

  it("lists archived conversations separately", async () => {
    const offset = jest.fn().mockResolvedValue([]);
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ offset }),
          }),
        }),
      }),
    });
    const { listAiConversations } = await import("./chat-history");

    await listAiConversations({
      userId: "user-1",
      offset: 0,
      limit: 30,
      archived: true,
    });

    expect(mockIsNotNull).toHaveBeenCalledWith(mockAiConversations.archivedAt);
    expect(mockIsNull).not.toHaveBeenCalled();
  });

  it("archives only a conversation owned by the user", async () => {
    const archivedAt = new Date("2026-08-22T01:00:00.000Z");
    const returning = jest
      .fn()
      .mockResolvedValue([{ ...conversation, archivedAt }]);
    const where = jest.fn().mockReturnValue({ returning });
    const set = jest.fn().mockReturnValue({ where });
    mockDb.update.mockReturnValue({ set });
    const { setAiConversationArchived } = await import("./chat-history");

    await expect(
      setAiConversationArchived({
        conversationId: "conversation-1",
        userId: "user-1",
        archived: true,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ archivedAt: archivedAt.toISOString() }),
    );
    expect(set).toHaveBeenCalledWith({ archivedAt: expect.anything() });
  });

  it("returns no detail when a conversation is not owned by the user", async () => {
    mockDb.select.mockReturnValue(ownedConversationQuery([]));
    const { getAiConversation } = await import("./chat-history");

    await expect(
      getAiConversation({
        conversationId: "conversation-1",
        userId: "other-user",
      }),
    ).resolves.toBeNull();
    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });

  it("upserts messages and derives an image-only conversation title", async () => {
    mockDb.select.mockReturnValue(ownedConversationQuery());
    const onConflictDoNothing = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing,
        onConflictDoUpdate: jest.fn(),
      }),
    });
    const where = jest.fn().mockResolvedValue(undefined);
    const update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({ where }),
    });
    mockDb.transaction.mockImplementation(
      async (
        task: (tx: { insert: typeof insert; update: typeof update }) => unknown,
      ) => task({ insert, update }),
    );
    const { saveAiMessages } = await import("./chat-history");

    await saveAiMessages({
      conversationId: "conversation-1",
      userId: "user-1",
      messages: [
        {
          id: "message-1",
          role: "user",
          parts: [
            {
              type: "file",
              mediaType: "image/png",
              filename: "reference-image.png",
              url: "https://cdn.example.com/reference-image.png",
            },
          ],
        },
      ],
    });

    expect(onConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(mockAiConversations);
    expect(
      mockSql.mock.calls.some((call) => call.includes("reference-image.png")),
    ).toBe(true);
  });

  it("rejects writes to conversations owned by another user", async () => {
    mockDb.select.mockReturnValue(ownedConversationQuery([]));
    const { AiConversationNotFoundError, saveAiMessages } =
      await import("./chat-history");

    await expect(
      saveAiMessages({
        conversationId: "conversation-1",
        userId: "other-user",
        messages: [
          {
            id: "message-1",
            role: "user",
            parts: [{ type: "text", text: "hello" }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(AiConversationNotFoundError);
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  it("updates regenerated assistant messages without changing their role", async () => {
    mockDb.select.mockReturnValue(
      ownedConversationQuery([{ ...conversation, title: "Existing title" }]),
    );
    const onConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
    const insert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: jest.fn(),
        onConflictDoUpdate,
      }),
    });
    const update = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });
    mockDb.transaction.mockImplementation(
      async (
        task: (tx: { insert: typeof insert; update: typeof update }) => unknown,
      ) => task({ insert, update }),
    );
    const { saveAiMessages } = await import("./chat-history");

    await saveAiMessages({
      conversationId: "conversation-1",
      userId: "user-1",
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          parts: [{ type: "text", text: "Updated answer" }],
        },
      ],
    });

    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        set: expect.objectContaining({ role: "assistant" }),
        setWhere: expect.anything(),
      }),
    );
  });
});
