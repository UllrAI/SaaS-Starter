import type { AgentToolName } from "../tools";
import type { AgentSkill } from "./types";

export interface ComposedSkills {
  instructions: string;
  toolNames: AgentToolName[];
}

/**
 * Composes the selected skills into one prompt fragment and the set of tool
 * names they need. Skills may share a tool; it is requested only once.
 */
export function composeSkills(skills: AgentSkill[]): ComposedSkills {
  const instructions = skills
    .map((skill) => `## Skill: ${skill.id}\n\n${skill.instructions.trim()}`)
    .join("\n\n");

  const toolNames = new Set(skills.flatMap((skill) => skill.toolNames ?? []));

  return { instructions, toolNames: [...toolNames] };
}
