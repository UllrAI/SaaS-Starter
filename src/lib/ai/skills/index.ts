import { accountSupportSkill } from "./account-support";
import { knowledgeBaseSkill } from "./knowledge-base";
import type { AgentSkill } from "./types";

// Register every available skill here; agents pick the subset they need.
export const agentSkills = {
  accountSupport: accountSupportSkill,
  knowledgeBase: knowledgeBaseSkill,
} satisfies Record<string, AgentSkill>;

export { composeSkills } from "./compose";
export type { AgentSkill } from "./types";
