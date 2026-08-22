import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getToolOrDynamicToolName, isToolUIPart } from "ai";
import { getUploadConfig } from "@/lib/config/integrations";
import { isFileSizeAllowed } from "@/lib/config/upload";
import { getR2Client } from "@/lib/r2";
import {
  completeUploadIntent,
  createUploadIntent,
} from "@/lib/uploads/upload-intents";
import type { AiMessage } from "./chat-history-types";

const GENERATED_IMAGE_CONTENT_TYPE = "image/webp";

function readBase64Result(output: unknown): string | null {
  if (
    typeof output !== "object" ||
    output === null ||
    !("result" in output) ||
    typeof output.result !== "string" ||
    output.result.length === 0
  ) {
    return null;
  }

  return output.result;
}

async function storeGeneratedImage(params: {
  base64: string;
  messageId: string;
  partIndex: number;
  userId: string;
}) {
  const body = Buffer.from(params.base64, "base64");
  if (!isFileSizeAllowed(body.byteLength)) {
    throw new Error("Generated image size is invalid.");
  }

  const fileName = `ai-${params.messageId}-${params.partIndex}.webp`;
  const intent = await createUploadIntent({
    userId: params.userId,
    fileName,
    fileSize: body.byteLength,
    contentType: GENERATED_IMAGE_CONTENT_TYPE,
  });

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getUploadConfig().bucketName,
      Key: intent.fileKey,
      Body: body,
      ContentLength: body.byteLength,
      ContentType: GENERATED_IMAGE_CONTENT_TYPE,
    }),
  );

  return completeUploadIntent({
    intentId: intent.id,
    userId: params.userId,
    key: intent.fileKey,
    contentLength: body.byteLength,
    contentType: GENERATED_IMAGE_CONTENT_TYPE,
  });
}

export async function persistGeneratedImages(params: {
  message: AiMessage;
  userId: string;
}): Promise<AiMessage> {
  if (params.message.role !== "assistant") return params.message;

  const message: AiMessage = {
    ...params.message,
    parts: params.message.parts.map((part) => ({
      ...part,
    })) as AiMessage["parts"],
  };

  for (let index = 0; index < message.parts.length; index += 1) {
    const part = message.parts[index];
    if (
      !part ||
      !isToolUIPart(part) ||
      part.state !== "output-available" ||
      getToolOrDynamicToolName(part) !== "generateImage"
    ) {
      continue;
    }

    const base64 = readBase64Result(part.output);
    if (!base64) continue;

    const stored = await storeGeneratedImage({
      base64,
      messageId: message.id,
      partIndex: index,
      userId: params.userId,
    });
    const output = { ...(part.output as Record<string, unknown>) };
    delete output.result;
    part.output = {
      ...output,
      url: stored.url,
      mediaType: stored.contentType,
    } as typeof part.output;
  }

  return message;
}
