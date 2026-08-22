import { describe, expect, it } from "@jest/globals";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { createMarkdownArtifact, extractArtifacts } from "./artifacts";

describe("canvas artifacts", () => {
  it("extracts presented Markdown and generated images", () => {
    const messages: AiMessage[] = [
      {
        id: "a1",
        role: "assistant",
        parts: [
          {
            type: "tool-presentArtifact",
            toolCallId: "tool-1",
            state: "output-available",
            input: {},
            output: {
              kind: "markdown",
              title: "Launch plan",
              content: "# Plan",
            },
          },
          {
            type: "tool-generateImage",
            toolCallId: "tool-2",
            state: "output-available",
            providerExecuted: true,
            input: {},
            output: { result: "abc123" },
          },
        ],
      },
    ];

    expect(extractArtifacts(messages)).toEqual([
      {
        id: "a1:0",
        kind: "markdown",
        title: "Launch plan",
        content: "# Plan",
      },
      {
        id: "a1:1",
        kind: "image",
        url: "data:image/webp;base64,abc123",
        mediaType: "image/webp",
      },
    ]);
  });

  it("turns assistant text into a Markdown canvas artifact", () => {
    const message: AiMessage = {
      id: "a1",
      role: "assistant",
      parts: [
        { type: "text", text: "First" },
        { type: "text", text: "Second" },
      ],
    };

    expect(createMarkdownArtifact(message, "Assistant response")).toEqual({
      id: "a1:markdown",
      kind: "markdown",
      title: "Assistant response",
      content: "First\n\nSecond",
    });
  });

  it("restores generated images from durable storage URLs", () => {
    const messages: AiMessage[] = [
      {
        id: "a2",
        role: "assistant",
        parts: [
          {
            type: "tool-generateImage",
            toolCallId: "tool-3",
            state: "output-available",
            providerExecuted: true,
            input: {},
            output: { url: "https://cdn.example.com/image.webp" },
          },
        ],
      },
    ];

    expect(extractArtifacts(messages)).toEqual([
      {
        id: "a2:0",
        kind: "image",
        url: "https://cdn.example.com/image.webp",
        mediaType: "image/webp",
      },
    ]);
  });
});
