jest.mock("@/lib/config/constants", () => ({ APP_NAME: "Test" }));
import { createAssistantAgent } from "./assistant";

const mockSettings = jest.fn();
const mockFeatures = { uploads: true };
jest.mock("ai", () => ({
  ...jest.requireActual("ai"),
  ToolLoopAgent: class {
    constructor(settings: unknown) {
      mockSettings(settings);
    }
  },
}));
jest.mock("@/lib/config/site", () => ({
  SITE_CONFIG: {
    get features() {
      return mockFeatures;
    },
  },
}));
jest.mock("../models", () => ({
  getChatModel: () => ({}),
  getImageGenerationTool: () => ({}),
}));
jest.mock("../tools", () => ({
  buildTools: (names: string[]) =>
    Object.fromEntries(names.map((name) => [name, {}])),
}));
jest.mock("../tool-approval", () => ({
  withToolApprovalSecret: (settings: unknown) => settings,
}));

const context = {
  userId: "user",
  conversationId: "conversation",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user" as const,
  locale: "en",
};
it.each([true, false])(
  "registers storage tools only when uploads=%s",
  (enabled) => {
    mockFeatures.uploads = enabled;
    createAssistantAgent(context, {
      reasoningEffort: "low",
      imageSize: "1024x1024",
    });
    const settings = mockSettings.mock.lastCall![0];
    expect("generateImage" in settings.tools).toBe(enabled);
    expect("saveDocument" in settings.tools).toBe(enabled);
    expect(settings.maxOutputTokens).toBeGreaterThan(0);
  },
);
it("removes image generation when the image allowance is exhausted", () => {
  mockFeatures.uploads = true;
  createAssistantAgent(context, {
    reasoningEffort: "low",
    imageSize: "1024x1024",
    allowImageGeneration: false,
  });
  expect(mockSettings.mock.lastCall![0].tools).not.toHaveProperty(
    "generateImage",
  );
});
it("removes image generation after its first call in the agent loop", () => {
  mockFeatures.uploads = true;
  createAssistantAgent(context, {
    reasoningEffort: "low",
    imageSize: "1024x1024",
  });
  const settings = mockSettings.mock.lastCall![0];
  expect(
    settings.prepareStep({
      steps: [{ toolCalls: [{ toolName: "generateImage" }] }],
    }).activeTools,
  ).not.toContain("generateImage");
});
