import type { ToolSet } from "ai";
import type { AgentContext } from "../context";
import type { AgentSkill } from "./types";

export interface ComposedSkills {
  instructions: string;
  tools: ToolSet;
}

/**
 * Merges tool sets, rejecting duplicate names so the model never sees an
 * ambiguous tool table.
 */
export function mergeToolSets(...sets: ToolSet[]): ToolSet {
  const merged: ToolSet = {};
  for (const set of sets) {
    for (const [name, entry] of Object.entries(set)) {
      if (name in merged) {
        throw new Error(`Duplicate agent tool "${name}".`);
      }
      merged[name] = entry;
    }
  }
  return merged;
}

/**
 * Composes the selected skills into one prompt fragment and one tool set.
 */
export function composeSkills(
  skills: AgentSkill[],
  context: AgentContext,
): ComposedSkills {
  const sections = skills.map(
    (skill) => `## Skill: ${skill.id}\n\n${skill.instructions.trim()}`,
  );
  const tools = mergeToolSets(
    ...skills.map((skill) => skill.tools?.(context) ?? {}),
  );

  return { instructions: sections.join("\n\n"), tools };
}
