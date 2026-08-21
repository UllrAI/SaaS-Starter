import "server-only";
import { ToolLoopAgent, isStepCount } from "ai";
import { APP_NAME } from "@/lib/config/constants";
import type { AgentContext } from "../context";
import { getChatModel } from "../models";
import { agentSkills, composeSkills } from "../skills";
import { buildTools, type AgentToolName } from "../tools";

const MAX_AGENT_STEPS = 10;

const ASSISTANT_SKILLS = [
  agentSkills.accountSupport,
  agentSkills.knowledgeBase,
];
// Tools available regardless of the skills above.
const ASSISTANT_TOOLS: AgentToolName[] = ["getCurrentTime"];

function buildInstructions(context: AgentContext, skillInstructions: string) {
  return `You are the in-app assistant of ${APP_NAME}.

You are talking to ${context.userName} (locale: ${context.locale}). Answer in the language of that locale unless the user writes in another language.
Be concise and factual. Use tools for anything you cannot know from the conversation, and say so when a question is outside what you or your tools can do.

${skillInstructions}`;
}

// Agents are cheap request-scoped objects: construct one per request so
// tools close over the authenticated session context.
export function createAssistantAgent(context: AgentContext) {
  const { instructions, toolNames } = composeSkills(ASSISTANT_SKILLS);

  return new ToolLoopAgent({
    model: getChatModel(),
    instructions: buildInstructions(context, instructions),
    tools: buildTools([...ASSISTANT_TOOLS, ...toolNames], context),
    stopWhen: isStepCount(MAX_AGENT_STEPS),
  });
}
