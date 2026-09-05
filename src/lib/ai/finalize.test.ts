import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { AiMessage } from "./chat-history-types";

const mockStoreFile = jest.fn();

describe("persistGeneratedImages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreFile.mockResolvedValue({
      url: "/api/files/content?key=image",
      contentType: "image/webp",
    });
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
    const { persistMessageImages } = await import("./finalize");

    const stored = await persistMessageImages(message, "user-1", mockStoreFile);

    expect(mockStoreFile).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        body: Buffer.from("image"),
        identity: "image:assistant-1:tool-1",
        contentType: "image/webp",
      }),
    );
    expect(mockStoreFile).toHaveBeenCalledTimes(1);
    expect(stored.parts[0]).toEqual(
      expect.objectContaining({
        output: {
          url: "/api/files/content?key=image",
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
    const { persistMessageImages } = await import("./finalize");

    await expect(
      persistMessageImages(message, "user-1", mockStoreFile),
    ).resolves.toEqual(message);
    expect(mockStoreFile).not.toHaveBeenCalled();
  });

  it("finishes a deleted image without recreating it or keeping its bytes", async () => {
    const { UploadFileDeletedError } = await import("@/lib/uploads/repository");
    const { persistMessageImages } = await import("./finalize");
    mockStoreFile.mockRejectedValue(new UploadFileDeletedError());
    const message: AiMessage = {
      id: "assistant-deleted",
      role: "assistant",
      parts: [
        {
          type: "tool-generateImage",
          toolCallId: "deleted-call",
          state: "output-available",
          providerExecuted: true,
          input: {},
          output: { result: Buffer.from("image").toString("base64") },
        },
      ],
    };
    const result = await persistMessageImages(message, "user-1", mockStoreFile);
    expect(result.parts[0]).toEqual(
      expect.objectContaining({ output: { storageStatus: "deleted" } }),
    );
  });
});
