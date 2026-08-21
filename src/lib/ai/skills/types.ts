import type { ToolSet } from "ai";
import type { AgentContext } from "../context";

/**
 * A skill bundles a system-prompt fragment with the tools it needs.
 * Register skills in `src/lib/ai/skills/index.ts` and attach them to an
 * agent definition; the agent composes them into one prompt and tool set.
 */
export interface AgentSkill {
  id: string;
  /** Shown to maintainers only; not sent to the model. */
  description: string;
  /** Markdown appended to the agent system prompt under a skill heading. */
  instructions: string;
  /** Tools the skill contributes, built per request from the session context. */
  tools?: (context: AgentContext) => ToolSet;
}
