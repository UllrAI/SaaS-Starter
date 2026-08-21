import { getToolOrDynamicToolName, isToolUIPart } from "ai";
import { artifactSchema } from "@/lib/ai/artifacts";
import type { AiMessage } from "./chat-types";

export type CanvasArtifact =
  | {
      id: string;
      kind: "markdown";
      title?: string;
      content: string;
    }
  | {
      id: string;
      kind: "image" | "video";
      title?: string;
      url: string;
      description?: string;
      mediaType?: string;
    };

function readGeneratedImage(output: unknown) {
  if (
    typeof output !== "object" ||
    output === null ||
    !("result" in output) ||
    typeof output.result !== "string" ||
    output.result.length === 0
  ) {
    return null;
  }

  return `data:image/webp;base64,${output.result}`;
}

export function extractArtifacts(messages: AiMessage[]) {
  const artifacts: CanvasArtifact[] = [];

  for (const message of messages) {
    if (message.role !== "assistant") {
      continue;
    }

    message.parts.forEach((part, index) => {
      const id = `${message.id}:${index}`;

      if (part.type === "file") {
        if (part.mediaType.startsWith("image")) {
          artifacts.push({
            id,
            kind: "image",
            title: part.filename,
            url: part.url,
            mediaType: part.mediaType,
          });
        } else if (part.mediaType.startsWith("video")) {
          artifacts.push({
            id,
            kind: "video",
            title: part.filename,
            url: part.url,
            mediaType: part.mediaType,
          });
        }
        return;
      }

      if (!isToolUIPart(part) || part.state !== "output-available") {
        return;
      }

      const toolName = getToolOrDynamicToolName(part);
      if (toolName === "presentArtifact") {
        const parsed = artifactSchema.safeParse(part.output);
        if (parsed.success) {
          artifacts.push({ id, ...parsed.data });
        }
        return;
      }

      if (toolName === "generateImage") {
        const url = readGeneratedImage(part.output);
        if (url) {
          artifacts.push({
            id,
            kind: "image",
            url,
            mediaType: "image/webp",
          });
        }
      }
    });
  }

  return artifacts;
}

export function createMarkdownArtifact(
  message: AiMessage,
  title: string,
): CanvasArtifact | null {
  const content = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n")
    .trim();

  return content
    ? {
        id: `${message.id}:markdown`,
        kind: "markdown",
        title,
        content,
      }
    : null;
}
