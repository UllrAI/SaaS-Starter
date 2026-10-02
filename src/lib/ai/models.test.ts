import { describe, expect, it } from "@jest/globals";
import { createAiModels } from "./models.node";
const { getChatModel, getImageGenerationTool } = createAiModels({
  apiKey: "test-key",
  baseUrl: "https://api.example.com/v1",
  defaultModel: "gpt-5.6-luna",
});

describe("getChatModel", () => {
  it("uses the Responses API model", async () => {
    const model = getChatModel();

    expect(model.provider).toBe("llm.responses");
    expect(model.modelId).toBe("gpt-5.6-luna");
  });

  it("hard-codes the low-cost GPT Image 2 tool", async () => {
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

  it("supports every application-approved 1K aspect ratio", async () => {
    expect(getImageGenerationTool("1536x1024").args.size).toBe("1536x1024");
    expect(getImageGenerationTool("1024x1536").args.size).toBe("1024x1536");
  });
});
