import "server-only";
import env from "@/env";
import { createAiModels } from "./models.node";

// The Responses API supports reasoning and function tools together. The base
// URL remains configurable for gateways that implement the OpenAI Responses
// protocol.
const models = createAiModels({
  apiKey: env.LLM_API_KEY,
  baseUrl: env.LLM_BASE_URL,
  defaultModel: env.AI_DEFAULT_MODEL,
});

export const getChatModel = models.getChatModel;
export const getImageGenerationTool = models.getImageGenerationTool;
