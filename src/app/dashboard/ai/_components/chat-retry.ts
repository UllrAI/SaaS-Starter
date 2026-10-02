import type { AiMessage } from "@/lib/ai/chat-history-types";

/** Restore the accepted input before replacing a failed response with a retry. */
export function restoreRetryMessages(
  messages: AiMessage[],
  retryMessage: AiMessage,
  assistantMessageId: string,
) {
  const restored = messages.filter(
    (message) => message.id !== assistantMessageId,
  );
  const inputIndex = restored.findIndex(
    (message) => message.id === retryMessage.id,
  );
  if (inputIndex < 0) return [...restored, retryMessage];
  return restored.map((message, index) =>
    index === inputIndex ? retryMessage : message,
  );
}
