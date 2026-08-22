import { describe, expect, it } from "@jest/globals";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { prepareChatRequest } from "./chat-request";

const firstUser: AiMessage = {
  id: "u1",
  role: "user",
  parts: [{ type: "text", text: "first" }],
};
const firstAssistant: AiMessage = {
  id: "a1",
  role: "assistant",
  metadata: { responseHandle: "resp_1.signature" },
  parts: [{ type: "text", text: "answer" }],
};
const secondUser: AiMessage = {
  id: "u2",
  role: "user",
  parts: [{ type: "text", text: "second" }],
};

describe("prepareChatRequest", () => {
  it("sends only messages after the last stored response", () => {
    expect(
      prepareChatRequest({
        messages: [firstUser, firstAssistant, secondUser],
        conversationId: "conversation-1",
        reasoningEffort: "low",
      }),
    ).toEqual({
      messages: [secondUser],
      conversationId: "conversation-1",
      agentId: "assistant",
      reasoningEffort: "low",
      responseHandle: "resp_1.signature",
    });
  });

  it("sends the full first turn when no response handle exists", () => {
    expect(
      prepareChatRequest({
        messages: [firstUser],
        conversationId: "conversation-1",
        reasoningEffort: "medium",
      }),
    ).toEqual({
      messages: [firstUser],
      conversationId: "conversation-1",
      agentId: "assistant",
      reasoningEffort: "medium",
    });
  });

  it("keeps the latest user turn when the SDK retries a failed response", () => {
    expect(
      prepareChatRequest({
        // useChat removes the target assistant before preparing a retry.
        messages: [firstUser, firstAssistant, secondUser],
        conversationId: "conversation-1",
        reasoningEffort: "high",
      }),
    ).toEqual({
      messages: [secondUser],
      conversationId: "conversation-1",
      agentId: "assistant",
      reasoningEffort: "high",
      responseHandle: "resp_1.signature",
    });
  });
});
