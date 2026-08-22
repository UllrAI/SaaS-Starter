import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { GptImage1kSize } from "./image-size";

export interface AiModelConfig {
  apiKey?: string;
  baseUrl: string;
  defaultModel: string;
}

export function createAiModels(config: AiModelConfig) {
  const provider = createOpenAI({
    name: "llm",
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
  });

  return {
    getChatModel(): LanguageModel {
      return provider.responses(config.defaultModel);
    },
    getImageGenerationTool(size: GptImage1kSize = "1024x1024") {
      return provider.tools.imageGeneration({
        model: "gpt-image-2",
        quality: "low",
        size,
        outputFormat: "webp",
        outputCompression: 80,
        partialImages: 0,
      });
    },
  };
}
