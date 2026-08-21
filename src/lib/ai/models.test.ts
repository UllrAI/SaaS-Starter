import { describe, expect, it, jest } from "@jest/globals";

jest.mock("server-only", () => ({}));

jest.mock("@/env", () => ({
  __esModule: true,
  default: {
    LLM_API_KEY: "test-key",
    LLM_BASE_URL: "https://api.example.com/v1",
    AI_DEFAULT_MODEL: "gpt-5.6-luna",
  },
}));

describe("getChatModel", () => {
  it("uses the Responses API model", async () => {
    const { getChatModel } = await import("./models");

    const model = getChatModel();

    expect(model.provider).toBe("llm.responses");
    expect(model.modelId).toBe("gpt-5.6-luna");
  });

  it("hard-codes the low-cost GPT Image 2 tool", async () => {
    const { getImageGenerationTool } = await import("./models");

    const imageTool = getImageGenerationTool();

    expect(imageTool.type).toBe("provider");
    expect(imageTool.id).toBe("openai.image_generation");
    expect(imageTool.args).toEqual({
      model: "gpt-image-2",
      quality: "low",
      size: "1024x1024",
      outputFormat: "webp",
      outputCompression: 80,
      partialImages: 0,
    });
  });
});
