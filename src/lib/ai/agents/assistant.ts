import "server-only";
import { ToolLoopAgent, isStepCount, type ToolSet } from "ai";
import { APP_NAME } from "@/lib/config/constants";
import { SITE_CONFIG } from "@/lib/config/site";
import type { AgentContext } from "../context";
import type { GptImage1kSize } from "../image-size";
import { getChatModel, getImageGenerationTool } from "../models";
import type { ReasoningEffort } from "../reasoning";
import { agentSkills, composeSkills } from "../skills";
import { withToolApprovalSecret } from "../tool-approval";
import { buildTools, type AgentToolName } from "../tools";

import { AI_MAX_STEPS, AI_MAX_OUTPUT_TOKENS } from "../limits";

const ASSISTANT_SKILLS = [
  agentSkills.accountSupport,
  agentSkills.knowledgeBase,
];
// Tools available regardless of the skills above.
const ASSISTANT_TOOLS: AgentToolName[] = ["getCurrentTime", "presentArtifact"];

export interface AssistantAgentOptions {
  reasoningEffort: ReasoningEffort;
  imageSize: GptImage1kSize;
  previousResponseId?: string;
  allowImageGeneration?: boolean;
}

function buildInstructions(context: AgentContext, skillInstructions: string) {
  return `You are the in-app assistant of ${APP_NAME}.

You are talking to ${context.userName} (locale: ${context.locale}). Answer in the language of that locale unless the user writes in another language.
Be concise and factual. Use tools for anything you cannot know from the conversation, and say so when a question is outside what you or your tools can do.
When the user asks for a substantial draft, plan, report, or other document, use presentArtifact with Markdown so they can work with it in the canvas.
Use presentArtifact for image or video URLs only when the URL was supplied by the user or another tool. Never invent a media URL.
Use generateImage when the user asks you to create an image. Generate at most one image per request. The application limits output to a 1K square, landscape, or portrait size based on the user's latest request.

${skillInstructions}`;
}

// Agents are cheap request-scoped objects: construct one per request so
// tools close over the authenticated session context.
export function createAssistantAgent(
  context: AgentContext,
  options: AssistantAgentOptions,
) {
  const skills = SITE_CONFIG.features.uploads
    ? [...ASSISTANT_SKILLS, agentSkills.documentStorage]
    : ASSISTANT_SKILLS;
  const { instructions, toolNames } = composeSkills(skills);
  const tools: ToolSet = {
    ...buildTools([...ASSISTANT_TOOLS, ...toolNames], context),
    ...(SITE_CONFIG.features.uploads && options.allowImageGeneration !== false
      ? { generateImage: getImageGenerationTool(options.imageSize) }
      : {}),
  };

  return new ToolLoopAgent(
    withToolApprovalSecret(
      {
        model: getChatModel(),
        reasoning: options.reasoningEffort,
        instructions:
          buildInstructions(context, instructions) +
          (!("generateImage" in tools)
            ? "\nImage generation is currently unavailable. Do not offer to generate images."
            : ""),
        tools,
        providerOptions: {
          openai: {
            maxToolCalls: 1,
            previousResponseId: options.previousResponseId,
            store: true,
          },
        },
        prepareStep: ({ steps }) => ({
          activeTools: Object.keys(tools).filter(
            (name) =>
              name !== "generateImage" ||
              !steps.some((step) =>
                step.toolCalls.some(
                  (call) => call.toolName === "generateImage",
                ),
              ),
          ),
        }),
        maxOutputTokens: AI_MAX_OUTPUT_TOKENS,
        stopWhen: isStepCount(AI_MAX_STEPS),
      },
      context,
    ),
  );
}
