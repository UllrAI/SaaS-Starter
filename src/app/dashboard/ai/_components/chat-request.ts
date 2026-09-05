import { isToolUIPart } from "ai";
import type { ReasoningEffort } from "@/lib/ai/reasoning";
import type { AiMessage } from "@/lib/ai/chat-history-types";

interface PrepareChatRequestOptions {
  messages: AiMessage[];
  conversationId: string;
  reasoningEffort: ReasoningEffort;
}

/**
 * True while an assistant turn is still waiting on its own tool call.
 *
 * Such a message carries a response handle like any other, but the server needs
 * to see it again: the approval the user just granted lives in its parts. Using
 * its handle would slice it out of the request and send nothing at all.
 */
function hasUnfinishedToolApproval(message: AiMessage) {
  return message.parts.some(
    (part) => isToolUIPart(part) && part.state === "approval-responded",
  );
}

export function prepareChatRequest({
  messages,
  conversationId,
  reasoningEffort,
}: PrepareChatRequestOptions) {
  const message = messages.at(-1);
  const approving =
    message?.role === "assistant" && hasUnfinishedToolApproval(message);
  return {
    requestId: crypto.randomUUID(),
    messages: message ? [message] : [],
    parentMessageId: approving ? message.id : (messages.at(-2)?.id ?? null),
    conversationId,
    agentId: "assistant",
    reasoningEffort,
  };
}
