import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import env from "@/env";

// Provider-neutral by design: any OpenAI-compatible endpoint works through
// LLM_BASE_URL + LLM_API_KEY (OpenAI, gateways, proxies, local runtimes).
// To use a vendor-specific SDK instead (e.g. @ai-sdk/anthropic), swap the
// provider here — tools, skills, agents, and routes stay untouched.
const llmProvider = createOpenAICompatible({
  name: "llm",
  baseURL: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
});

export function getChatModel(): LanguageModel {
  return llmProvider(env.AI_DEFAULT_MODEL);
}
