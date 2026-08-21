import { describe, expect, it } from "@jest/globals";
import type { AiMessage } from "./chat-types";
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
        trigger: "submit-message",
        reasoningEffort: "low",
      }),
    ).toEqual({
      messages: [secondUser],
      agentId: "assistant",
      reasoningEffort: "low",
      responseHandle: "resp_1.signature",
    });
  });

  it("sends the full first turn when no response handle exists", () => {
    expect(
      prepareChatRequest({
        messages: [firstUser],
        trigger: "submit-message",
        reasoningEffort: "medium",
      }),
    ).toEqual({
      messages: [firstUser],
      agentId: "assistant",
      reasoningEffort: "medium",
    });
  });

  it("regenerates from the response before the target assistant", () => {
    const secondAssistant: AiMessage = {
      id: "a2",
      role: "assistant",
      metadata: { responseHandle: "resp_2.signature" },
      parts: [{ type: "text", text: "second answer" }],
    };

    expect(
      prepareChatRequest({
        messages: [firstUser, firstAssistant, secondUser, secondAssistant],
        trigger: "regenerate-message",
        messageId: "a2",
        reasoningEffort: "high",
      }),
    ).toEqual({
      messages: [secondUser],
      agentId: "assistant",
      reasoningEffort: "high",
      responseHandle: "resp_1.signature",
    });
  });
});
