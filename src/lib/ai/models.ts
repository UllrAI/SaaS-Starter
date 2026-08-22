import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import env from "@/env";
import type { GptImage1kSize } from "./image-size";

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

export function getImageGenerationTool(size: GptImage1kSize = "1024x1024") {
  return llmProvider.tools.imageGeneration({
    model: "gpt-image-2",
    quality: "low",
    size,
    outputFormat: "webp",
    outputCompression: 80,
    partialImages: 0,
  });
}
