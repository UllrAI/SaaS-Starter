import type { AgentContext } from "../context";
import { createAssistantAgent } from "./assistant";

// Register every agent here. The chat route resolves agents by id, so a new
// agent only needs a factory entry to become reachable.
const agentFactories = {
  assistant: createAssistantAgent,
};

export type AgentId = keyof typeof agentFactories;

export function isAgentId(value: string): value is AgentId {
  return value in agentFactories;
}

export function createAgent(agentId: AgentId, context: AgentContext) {
  return agentFactories[agentId](context);
}
