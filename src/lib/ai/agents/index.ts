import type { AgentContext } from "../context";
import type { GptImage1kSize } from "../image-size";
import type { ReasoningEffort } from "../reasoning";
import {
  createAssistantAgent,
  type AssistantAgentDependencies,
} from "./assistant";

// Register every agent here. The chat route resolves agents by id, so a new
// agent only needs a factory entry to become reachable.
const agentFactories = {
  assistant: createAssistantAgent,
};

export type AgentId = keyof typeof agentFactories;

export function isAgentId(value: string): value is AgentId {
  return Object.hasOwn(agentFactories, value);
}

export interface CreateAgentOptions {
  reasoningEffort: ReasoningEffort;
  imageSize: GptImage1kSize;
  previousResponseId?: string;
  allowImageGeneration?: boolean;
}

export function createAgent(
  agentId: AgentId,
  context: AgentContext,
  options: CreateAgentOptions,
  dependencies: AssistantAgentDependencies,
) {
  return agentFactories[agentId](context, options, dependencies);
}
