import "server-only";
import { db } from "@/database";
import type { AiMessage } from "./chat-history-types";
import { requireOwnedAiImageAttachments as requireOwned } from "./chat-attachments.node";
export { AiAttachmentValidationError } from "./chat-attachments.node";

export function requireOwnedAiImageAttachments(params: {
  messages: AiMessage[];
  userId: string;
}) {
  return requireOwned(db, params);
}
