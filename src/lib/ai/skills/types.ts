import type { AgentToolName } from "../tools";

/**
 * A skill bundles a system-prompt fragment with the tools it needs.
 * Register skills in `src/lib/ai/skills/index.ts` and attach them to an
 * agent definition; the agent composes them into one prompt and tool set.
 */
export interface AgentSkill {
  id: string;
  /** Markdown appended to the agent system prompt under a skill heading. */
  instructions: string;
  /** Tools the skill needs, by their name in the tool registry. */
  toolNames?: AgentToolName[];
}
