import { isDeepStrictEqual } from "node:util";
import { isToolUIPart } from "ai";
import type { AiMessage } from "./chat-history-types";

export class AiTranscriptConflictError extends Error {
  constructor(
    message: string,
    readonly code = "ai_conversation_changed",
  ) {
    super(message);
  }
}

// Only a new user message or approval decisions may cross the client boundary.
export function mergeAiTranscript(
  history: AiMessage[],
  incoming: AiMessage[],
  parentMessageId: string | null,
): AiMessage[] {
  const latest = history.at(-1);
  if (incoming.length !== 1)
    throw new AiTranscriptConflictError("Send one message at a time.");
  const message = incoming[0];
  if (message.role === "user") {
    if (
      latest?.id === message.id &&
      latest.role === "user" &&
      (history.at(-2)?.id ?? null) === parentMessageId &&
      isDeepStrictEqual(latest.parts, message.parts)
    )
      return history;

    if (
      (latest?.id ?? null) !== parentMessageId ||
      history.some((item) => item.id === message.id)
    )
      throw new AiTranscriptConflictError(
        "The conversation changed. Reload it before sending again.",
      );
    if (
      message.parts.some((part) => part.type !== "text" && part.type !== "file")
    )
      throw new AiTranscriptConflictError("Invalid user message.");
    return [...history, { ...message, metadata: undefined }];
  }
  if (
    message.role !== "assistant" ||
    !latest ||
    latest.id !== message.id ||
    latest.id !== parentMessageId ||
    latest.role !== "assistant" ||
    message.parts.length !== latest.parts.length
  )
    throw new AiTranscriptConflictError("Invalid approval response.");
  let decisions = 0;
  const merged = structuredClone(latest);
  merged.parts = latest.parts.map((part, index) => {
    const received = message.parts[index];
    if (
      isToolUIPart(part) &&
      part.state === "approval-responded" &&
      isDeepStrictEqual(part, received)
    ) {
      // A crashed run can resume its accepted decision. Mutating tools use the
      // conversation/tool-call identity so replay cannot duplicate their effect.
      decisions += 1;
      return part;
    }
    if (
      !isToolUIPart(part) ||
      part.state !== "approval-requested" ||
      !isToolUIPart(received) ||
      received.state !== "approval-responded"
    ) {
      if (!isDeepStrictEqual(part, received))
        throw new AiTranscriptConflictError(
          "Only approval decisions can be changed.",
        );
      return part;
    }
    const { state: _state, approval, ...rest } = received;
    const {
      state: _originalState,
      approval: originalApproval,
      ...original
    } = part;
    if (
      _state !== "approval-responded" ||
      _originalState !== "approval-requested" ||
      !isDeepStrictEqual(rest, original) ||
      approval.id !== originalApproval.id ||
      typeof approval.approved !== "boolean"
    )
      throw new AiTranscriptConflictError("Approval input changed.");
    decisions += 1;
    return {
      ...part,
      state: "approval-responded" as const,
      approval: { ...originalApproval, approved: approval.approved },
    };
  });
  if (!decisions) throw new AiTranscriptConflictError("No pending approval.");
  return [...history.slice(0, -1), merged];
}
