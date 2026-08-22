import type { ReasoningEffort } from "@/lib/ai/reasoning";
import type { AiMessage } from "@/lib/ai/chat-history-types";

interface PrepareChatRequestOptions {
  messages: AiMessage[];
  conversationId: string;
  reasoningEffort: ReasoningEffort;
}

export function prepareChatRequest({
  messages,
  conversationId,
  reasoningEffort,
}: PrepareChatRequestOptions) {
  let responseIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
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
  const requestMessages = messages.slice(responseIndex + 1);

  return {
    messages: requestMessages,
    conversationId,
    agentId: "assistant",
    reasoningEffort,
    ...(responseHandle ? { responseHandle } : {}),
  };
}
