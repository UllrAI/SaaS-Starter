import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import env from "@/env";

// The Responses API supports reasoning and function tools together. The base
// URL remains configurable for gateways that implement the OpenAI Responses
// protocol.
const llmProvider = createOpenAI({
  name: "llm",
  baseURL: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
});

export function getChatModel(): LanguageModel {
  return llmProvider.responses(env.AI_DEFAULT_MODEL);
}

export function getImageGenerationTool() {
  return llmProvider.tools.imageGeneration({
    model: "gpt-image-2",
    quality: "low",
    size: "1024x1024",
    outputFormat: "webp",
    outputCompression: 80,
    partialImages: 0,
  });
}
