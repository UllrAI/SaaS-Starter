import { isToolUIPart } from "ai";
import type { AiMessage } from "@/lib/ai/chat-history-types";

/**
 * Returns the approval the user may act on, which is always the oldest one
 * still waiting.
 *
 * The assistant is configured for one tool call per step, so a second pending
 * approval should not occur today — but that is a provider option rather than
 * an invariant. Resolving the active one here keeps a configuration change from
 * turning the transcript into a row of interchangeable buttons.
 */
export function findActiveToolApprovalId(
  messages: AiMessage[],
): string | undefined {
  for (const message of messages) {
    for (const part of message.parts) {
      if (isToolUIPart(part) && part.state === "approval-requested") {
        return part.approval.id;
      }
    }
  }
  return undefined;
}
