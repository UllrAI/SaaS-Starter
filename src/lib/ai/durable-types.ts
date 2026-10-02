import type { AiMessage } from "./chat-history-types";
import type { ReasoningEffort } from "./reasoning";
import type { SupportedLocale } from "@/lib/config/i18n";

export const AI_GENERATION_JOB = "ai.generate";
export const ACTIVE_AI_RUN_STATUSES = ["queued", "running"] as const;

export interface AiGenerationInput {
  messages: AiMessage[];
  request: {
    message: AiMessage;
    retryRunId?: string;
    parentMessageId: string | null;
    agentId: string;
    reasoningEffort: ReasoningEffort;
  };
  agentId: string;
  reasoningEffort: ReasoningEffort;
  locale: SupportedLocale;
  allowImageGeneration: boolean;
}

export interface AiRunSummary {
  id: string;
  runId: string;
  conversationId: string;
  assistantMessageId: string;
  status: string;
}
