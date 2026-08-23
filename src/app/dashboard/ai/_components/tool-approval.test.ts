import { describe, expect, it } from "@jest/globals";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { findActiveToolApprovalId } from "./tool-approval";

function assistantMessage(id: string, parts: AiMessage["parts"]): AiMessage {
  return { id, role: "assistant", parts };
}

function approvalRequest(toolCallId: string, approvalId: string) {
  return {
    type: "tool-saveDocument" as const,
    toolCallId,
    state: "approval-requested" as const,
    input: { fileName: "notes.md", content: "# Notes" },
    approval: { id: approvalId },
  };
}

describe("findActiveToolApprovalId", () => {
  it("returns nothing when no tool call is waiting", () => {
    const messages: AiMessage[] = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
      assistantMessage("a1", [{ type: "text", text: "hello" }]),
    ];

    expect(findActiveToolApprovalId(messages)).toBeUndefined();
  });

  it("returns the id of a waiting tool call", () => {
    const messages: AiMessage[] = [
      assistantMessage("a1", [approvalRequest("call-1", "approval-1")]),
    ];

    expect(findActiveToolApprovalId(messages)).toBe("approval-1");
  });

  it("picks the oldest of several waiting approvals", () => {
    const messages: AiMessage[] = [
      assistantMessage("a1", [
        approvalRequest("call-1", "approval-1"),
        approvalRequest("call-2", "approval-2"),
      ]),
      assistantMessage("a2", [approvalRequest("call-3", "approval-3")]),
    ];

    expect(findActiveToolApprovalId(messages)).toBe("approval-1");
  });

  it("ignores approvals the user has already answered", () => {
    const messages: AiMessage[] = [
      assistantMessage("a1", [
        {
          type: "tool-saveDocument",
          toolCallId: "call-1",
          state: "approval-responded",
          input: { fileName: "notes.md", content: "# Notes" },
          approval: { id: "approval-1", approved: true },
        },
        {
          type: "tool-saveDocument",
          toolCallId: "call-2",
          state: "output-denied",
          input: { fileName: "other.md", content: "# Other" },
          approval: { id: "approval-2", approved: false },
        },
      ]),
    ];

    expect(findActiveToolApprovalId(messages)).toBeUndefined();
  });

  it("promotes the next approval once the previous one has run", () => {
    const messages: AiMessage[] = [
      assistantMessage("a1", [
        {
          type: "tool-saveDocument",
          toolCallId: "call-1",
          state: "output-available",
          input: { fileName: "notes.md", content: "# Notes" },
          output: { fileName: "notes.md", fileSize: 7, url: "https://x/y" },
          approval: { id: "approval-1", approved: true },
        },
        approvalRequest("call-2", "approval-2"),
      ]),
    ];

    expect(findActiveToolApprovalId(messages)).toBe("approval-2");
  });
});
