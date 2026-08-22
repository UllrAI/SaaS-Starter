import type { UIMessage } from "ai";

interface AiMessageMetadata extends Record<string, unknown> {
  responseHandle?: string;
}

export type AiMessage = UIMessage<AiMessageMetadata>;

export interface AiConversationSummary {
  id: string;
  title: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationPage {
  conversations: AiConversationSummary[];
  hasMore: boolean;
}

export interface AiConversationDetail {
  conversation: AiConversationSummary;
  messages: AiMessage[];
}
