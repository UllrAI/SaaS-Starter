import "server-only";
import { ToolLoopAgent, isStepCount } from "ai";
import { APP_NAME } from "@/lib/config/constants";
import type { AgentContext } from "../context";
import { getChatModel } from "../models";
import { agentSkills, composeSkills } from "../skills";
import { mergeToolSets } from "../skills/compose";
import { getCurrentTime } from "../tools/get-current-time";

const MAX_AGENT_STEPS = 10;

const assistantSkills = [agentSkills.accountSupport, agentSkills.knowledgeBase];

function buildInstructions(context: AgentContext, skillInstructions: string) {
  return `You are the in-app assistant of ${APP_NAME}.

You are talking to ${context.userName} (locale: ${context.locale}). Answer in the language of that locale unless the user writes in another language.
Be concise and factual. Use tools for anything you cannot know from the conversation, and say so when a question is outside what you or your tools can do.

${skillInstructions}`;
}

// Agents are cheap request-scoped objects: construct one per request so
// tools close over the authenticated session context.
export function createAssistantAgent(context: AgentContext) {
  const { instructions, tools } = composeSkills(assistantSkills, context);

  return new ToolLoopAgent({
    model: getChatModel(),
    instructions: buildInstructions(context, instructions),
    tools: mergeToolSets({ getCurrentTime }, tools),
    stopWhen: isStepCount(MAX_AGENT_STEPS),
  });
}
