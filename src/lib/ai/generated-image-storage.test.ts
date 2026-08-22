import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AiMessage } from "./chat-history-types";

const mockPutObjectCommand = jest.fn((input: unknown) => input);
const mockSend = jest.fn();
const mockCreateUploadIntent = jest.fn();
const mockCompleteUploadIntent = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: mockPutObjectCommand,
}));
jest.mock("@/lib/config/integrations", () => ({
  getUploadConfig: () => ({ bucketName: "bucket" }),
}));
jest.mock("@/lib/r2", () => ({
  getR2Client: () => ({ send: mockSend }),
}));
jest.mock("@/lib/uploads/upload-intents", () => ({
  createUploadIntent: mockCreateUploadIntent,
  completeUploadIntent: mockCompleteUploadIntent,
}));

describe("persistGeneratedImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUploadIntent.mockResolvedValue({
      id: "intent-1",
      fileKey: "uploads/user-1/image.webp",
    });
    mockCompleteUploadIntent.mockResolvedValue({
      url: "https://cdn.example.com/image.webp",
      contentType: "image/webp",
    });
    mockSend.mockResolvedValue({});
  });

  it("moves generated image bytes to R2 before persisting the message", async () => {
    const message: AiMessage = {
      id: "assistant-1",
      role: "assistant",
      parts: [
        {
          type: "tool-generateImage",
          toolCallId: "tool-1",
          state: "output-available",
          providerExecuted: true,
          input: {},
          output: { result: Buffer.from("image").toString("base64") },
        },
      ],
    };
    const { persistGeneratedImages } =
      await import("./generated-image-storage");

    const stored = await persistGeneratedImages({ message, userId: "user-1" });

    expect(mockCreateUploadIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        fileSize: 5,
        contentType: "image/webp",
      }),
    );
    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(stored.parts[0]).toEqual(
      expect.objectContaining({
        output: {
          url: "https://cdn.example.com/image.webp",
          mediaType: "image/webp",
        },
      }),
    );
    expect(message.parts[0]).toEqual(
      expect.objectContaining({
        output: expect.objectContaining({ result: expect.any(String) }),
      }),
    );
  });

  it("leaves user messages untouched", async () => {
    const message: AiMessage = {
      id: "user-1",
      role: "user",
      parts: [{ type: "text", text: "hello" }],
    };
    const { persistGeneratedImages } =
      await import("./generated-image-storage");

    await expect(
      persistGeneratedImages({ message, userId: "user-1" }),
    ).resolves.toBe(message);
    expect(mockCreateUploadIntent).not.toHaveBeenCalled();
  });
});
