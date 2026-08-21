import type { ToolSet } from "ai";
import type { AgentContext } from "../context";
import { createGetAccountOverview } from "./get-account-overview";
import { createGetCurrentTime } from "./get-current-time";
import { createReadArticle, createSearchKnowledgeBase } from "./knowledge-base";
import { createPresentArtifact } from "./present-artifact";

/**
 * The tool registry. Each key is the name the model sees, so every tool name
 * is defined exactly once and collisions are impossible by construction.
 * Add a tool by creating a file in this folder and registering its factory
 * here; skills and agents then reference it by name.
 */
export const agentTools = {
  getCurrentTime: createGetCurrentTime,
  getAccountOverview: createGetAccountOverview,
  searchKnowledgeBase: createSearchKnowledgeBase,
  readArticle: createReadArticle,
  presentArtifact: createPresentArtifact,
} satisfies Record<string, (context: AgentContext) => ToolSet[string]>;

export type AgentToolName = keyof typeof agentTools;

export function buildTools(
  names: Iterable<AgentToolName>,
  context: AgentContext,
): ToolSet {
  return Object.fromEntries(
    [...names].map((name) => [name, agentTools[name](context)]),
  );
}
