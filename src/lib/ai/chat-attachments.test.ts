import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockDb = { select: jest.fn() };
const mockUploads = {
  userId: "uploads.userId",
  url: "uploads.url",
  contentType: "uploads.contentType",
  fileSize: "uploads.fileSize",
};

jest.mock("@/database", () => ({ db: mockDb }));
jest.mock("@/database/schema", () => ({ uploads: mockUploads }));
jest.mock("drizzle-orm", () => ({
  isNull: jest.fn(),
  and: jest.fn((...values: unknown[]) => values),
  eq: jest.fn((column: unknown, value: unknown) => [column, value]),
  inArray: jest.fn((column: unknown, values: unknown[]) => [column, values]),
}));

function uploadQuery(
  rows: Array<{ url: string; contentType: string; fileSize: number }>,
) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  };
}

function imageMessage(url = "https://cdn.example.com/reference.png") {
  return {
    id: "message-1",
    role: "user" as const,
    parts: [
      {
        type: "file" as const,
        mediaType: "image/png",
        filename: "reference.png",
        url,
      },
    ],
  };
}

describe("AI chat image attachment validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("does not query uploads for text-only messages", async () => {
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await requireOwnedAiImageAttachments({
      userId: "user-1",
      messages: [
        {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "hello" }],
        },
      ],
    });

    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("accepts a supported image uploaded by the current user", async () => {
    const url = "https://cdn.example.com/reference.png";
    mockDb.select.mockReturnValue(
      uploadQuery([{ url, contentType: "image/png", fileSize: 1024 }]),
    );
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await expect(
      requireOwnedAiImageAttachments({
        userId: "user-1",
        messages: [imageMessage(url)],
      }),
    ).resolves.toBeDefined();
  });

  it("rejects an arbitrary URL or another user's upload", async () => {
    mockDb.select.mockReturnValue(uploadQuery([]));
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await expect(
      requireOwnedAiImageAttachments({
        userId: "user-1",
        messages: [imageMessage("https://attacker.example/image.png")],
      }),
    ).rejects.toThrow("Invalid AI chat attachment");
  });

  it("rejects unsupported media types before querying storage", async () => {
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await expect(
      requireOwnedAiImageAttachments({
        userId: "user-1",
        messages: [
          {
            ...imageMessage(),
            parts: [
              {
                type: "file",
                mediaType: "image/svg+xml",
                url: "https://cdn.example.com/reference.svg",
              },
            ],
          },
        ],
      }),
    ).rejects.toThrow("Invalid AI chat attachment");
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("rejects more than six images", async () => {
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await expect(
      requireOwnedAiImageAttachments({
        userId: "user-1",
        messages: [
          {
            id: "message-1",
            role: "user",
            parts: Array.from({ length: 7 }, (_, index) => ({
              type: "file" as const,
              mediaType: "image/png",
              url: `https://cdn.example.com/${index}.png`,
            })),
          },
        ],
      }),
    ).rejects.toThrow("Invalid AI chat attachment");
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("accepts six images in one message", async () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({
      url: `https://cdn.example.com/${index}.png`,
      contentType: "image/png",
      fileSize: 1024,
    }));
    mockDb.select.mockReturnValue(uploadQuery(rows));
    const { requireOwnedAiImageAttachments } =
      await import("./chat-attachments");

    await expect(
      requireOwnedAiImageAttachments({
        userId: "user-1",
        messages: [
          {
            id: "message-1",
            role: "user",
            parts: rows.map((row) => ({
              type: "file" as const,
              mediaType: "image/png",
              url: row.url,
            })),
          },
        ],
      }),
    ).resolves.toBeDefined();
  });
});
