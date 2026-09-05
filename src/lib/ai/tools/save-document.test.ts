import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";

const mockStoreFile = jest.fn();
jest.mock("@/lib/uploads/server-storage", () => ({ storeFile: mockStoreFile }));
import { UploadQuotaExceededError } from "@/lib/uploads/repository";

const context: AgentContext = {
  userId: "user-1",
  conversationId: "conversation-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

const executionOptions = { toolCallId: "call-1" } as ToolExecutionOptions;

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
    mockStoreFile.mockResolvedValue({
      fileName: "notes.md",
      fileSize: 5,
      url: "/api/files/content?key=notes",
    });
  });

  it("requires approval before it can run", async () => {
    const { createSaveDocument } = await import("./save-document");
    expect(createSaveDocument(context).needsApproval).toBe(true);
  });

  it("stores the document under the session user and returns its URL", async () => {
    const result = await runTool({ fileName: "notes", content: "hello" });

    expect(mockStoreFile).toHaveBeenCalledWith({
      userId: "user-1",
      fileName: "notes.md",
      identity: "document:conversation-1:call-1",
      body: Buffer.from("hello"),
      contentType: "text/markdown",
    });
    expect(result).toEqual({
      fileName: "notes.md",
      fileSize: 5,
      url: "/api/files/content?key=notes",
    });
  });

  it("keeps a model-chosen name from escaping the user's key prefix", async () => {
    await runTool({ fileName: "../../etc/passwd.md", content: "hello" });

    expect(mockStoreFile).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "..-..-etc-passwd.md" }),
    );
  });

  it("reports a full quota instead of failing the turn", async () => {
    mockStoreFile.mockRejectedValue(new UploadQuotaExceededError("total"));

    const result = await runTool({ fileName: "notes", content: "hello" });

    expect(result).toEqual({
      error: expect.stringContaining("Storage allowance"),
    });
  });
});
