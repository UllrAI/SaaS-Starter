import type { ReasoningEffort } from "@/lib/ai/reasoning";
import type { AiMessage } from "./chat-types";

interface PrepareChatRequestOptions {
  messages: AiMessage[];
  trigger: "submit-message" | "regenerate-message";
  messageId?: string;
  reasoningEffort: ReasoningEffort;
}

function findLastAssistantIndex(messages: AiMessage[], before: number) {
  for (let index = before - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "assistant") {
      return index;
    }
  }
  return -1;
}

export function prepareChatRequest({
  messages,
  trigger,
  messageId,
  reasoningEffort,
}: PrepareChatRequestOptions) {
  let requestEnd = messages.length;

  if (trigger === "regenerate-message") {
    const requestedIndex = messageId
      ? messages.findIndex((message) => message.id === messageId)
      : -1;
    const targetIndex =
      requestedIndex >= 0
        ? requestedIndex
        : findLastAssistantIndex(messages, messages.length);
    if (targetIndex >= 0) {
      requestEnd = targetIndex;
    }
  }

  let responseIndex = -1;
  for (let index = requestEnd - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && message.metadata?.responseHandle) {
      responseIndex = index;
      break;
    }
  }

  const responseHandle =
    responseIndex >= 0
      ? messages[responseIndex]?.metadata?.responseHandle
      : undefined;
  const requestMessages = messages.slice(responseIndex + 1, requestEnd);

  return {
    messages: requestMessages,
    agentId: "assistant",
    reasoningEffort,
    ...(responseHandle ? { responseHandle } : {}),
  };
}
