import { describe, expect, it } from "@jest/globals";
import type { AiMessage } from "./chat-history-types";
import { selectGptImage1kSize } from "./image-size";

function userMessage(text: string): AiMessage {
  return {
    id: "message-1",
    role: "user",
    parts: [{ type: "text", text }],
  };
}

describe("selectGptImage1kSize", () => {
  it.each([
    ["生成一张横版产品图", "1536x1024"],
    ["Create a 16:9 landscape illustration", "1536x1024"],
    ["生成一张竖版手机壁纸", "1024x1536"],
    ["Create a portrait poster", "1024x1536"],
    ["生成一张 1200x800 的图", "1536x1024"],
    ["生成一张 800×1200 的图", "1024x1536"],
    ["Create a square avatar", "1024x1024"],
    ["帮我生成一张图片", "1024x1024"],
  ] as const)("maps %s to %s", (text, expected) => {
    expect(selectGptImage1kSize([userMessage(text)])).toBe(expected);
  });

  it("uses only the latest user request", () => {
    expect(
      selectGptImage1kSize([
        userMessage("Create a portrait image"),
        {
          id: "assistant-1",
          role: "assistant",
          parts: [{ type: "text", text: "Sure" }],
        },
        { ...userMessage("Make it landscape"), id: "message-2" },
      ]),
    ).toBe("1536x1024");
  });
});
