import type { UIMessage } from "ai";

interface AiMessageMetadata {
  responseHandle?: string;
}

export type AiMessage = UIMessage<AiMessageMetadata>;
