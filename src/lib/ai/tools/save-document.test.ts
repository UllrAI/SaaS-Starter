import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";

const mockPutObjectCommand = jest.fn((input: unknown) => input);
const mockSend = jest.fn();
const mockCreateUploadIntent = jest.fn();
const mockCompleteUploadIntent = jest.fn();

class UploadQuotaExceededError extends Error {
  constructor(readonly quota: "daily" | "total") {
    super(`The ${quota} upload quota has been reached.`);
    this.name = "UploadQuotaExceededError";
  }
}

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
  UploadQuotaExceededError,
}));

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

const executionOptions = {} as ToolExecutionOptions;

async function runTool(input: { fileName: string; content: string }) {
  const { createSaveDocument } = await import("./save-document");
  return (await createSaveDocument(context).execute!(
    input,
    executionOptions,
  )) as { fileName: string; fileSize: number; url: string } | { error: string };
}

describe("saveDocument", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUploadIntent.mockResolvedValue({
      id: "intent-1",
      fileKey: "uploads/user-1/intent-1.md",
    });
    mockCompleteUploadIntent.mockResolvedValue({
      fileName: "notes.md",
      fileSize: 5,
      url: "https://cdn.example.com/notes.md",
    });
    mockSend.mockResolvedValue({});
  });

  it("requires approval before it can run", async () => {
    const { createSaveDocument } = await import("./save-document");
    expect(createSaveDocument(context).needsApproval).toBe(true);
  });

  it("stores the document under the session user and returns its URL", async () => {
    const result = await runTool({ fileName: "notes", content: "hello" });

    expect(mockCreateUploadIntent).toHaveBeenCalledWith({
      userId: "user-1",
      fileName: "notes.md",
      fileSize: 5,
      contentType: "text/markdown",
    });
    expect(mockPutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: "uploads/user-1/intent-1.md",
        ContentType: "text/markdown",
      }),
    );
    expect(result).toEqual({
      fileName: "notes.md",
      fileSize: 5,
      url: "https://cdn.example.com/notes.md",
    });
  });

  it("keeps a model-chosen name from escaping the user's key prefix", async () => {
    await runTool({ fileName: "../../etc/passwd.md", content: "hello" });

    expect(mockCreateUploadIntent).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "..-..-etc-passwd.md" }),
    );
  });

  it("reports a full quota instead of failing the turn", async () => {
    mockCreateUploadIntent.mockRejectedValue(
      new UploadQuotaExceededError("total"),
    );

    const result = await runTool({ fileName: "notes", content: "hello" });

    expect(result).toEqual({ error: expect.stringContaining("total") });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
