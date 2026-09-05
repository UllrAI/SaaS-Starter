import "server-only";

import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/database";
import { getFileReadUrl } from "@/lib/r2";
import { uploads } from "@/database/schema";
import { isFileSizeAllowed, normalizeContentType } from "@/lib/config/upload";
import type { AiMessage } from "./chat-history-types";
import {
  AI_IMAGE_INPUT_MAX_FILES,
  isAiImageInputMediaType,
} from "./image-input";

export class AiAttachmentValidationError extends Error {
  constructor() {
    super("Invalid AI chat attachment.");
    this.name = "AiAttachmentValidationError";
  }
}

export async function requireOwnedAiImageAttachments(params: {
  messages: AiMessage[];
  userId: string;
}) {
  const userAttachments = params.messages
    .filter((message) => message.role === "user")
    .map((message) => message.parts.filter((part) => part.type === "file"));
  const attachments = userAttachments.flat();

  if (attachments.length === 0) return [];
  if (
    userAttachments.some(
      (messageAttachments) =>
        messageAttachments.length > AI_IMAGE_INPUT_MAX_FILES,
    )
  ) {
    throw new AiAttachmentValidationError();
  }

  const urls = new Set<string>();
  for (const attachment of attachments) {
    const mediaType = normalizeContentType(attachment.mediaType);
    if (!attachment.url || !isAiImageInputMediaType(mediaType)) {
      throw new AiAttachmentValidationError();
    }
    urls.add(attachment.url);
  }

  const rows = await db
    .select({
      url: uploads.url,
      fileKey: uploads.fileKey,
      contentType: uploads.contentType,
      fileSize: uploads.fileSize,
    })
    .from(uploads)
    .where(
      and(
        eq(uploads.userId, params.userId),
        isNull(uploads.deletedAt),
        inArray(uploads.url, [...urls]),
      ),
    );
  const rowsByUrl = new Map(rows.map((row) => [row.url, row]));

  for (const attachment of attachments) {
    const row = rowsByUrl.get(attachment.url);
    if (
      !row ||
      normalizeContentType(row.contentType) !==
        normalizeContentType(attachment.mediaType) ||
      !isAiImageInputMediaType(normalizeContentType(row.contentType)) ||
      !isFileSizeAllowed(row.fileSize)
    ) {
      throw new AiAttachmentValidationError();
    }
  }
  return rows;
}

export async function resolveAiImageAttachments(
  messages: AiMessage[],
  userId: string,
): Promise<AiMessage[]> {
  const rows = await requireOwnedAiImageAttachments({ messages, userId });
  const signed = new Map(
    await Promise.all(
      rows.map(
        async (row) => [row.url, await getFileReadUrl(row.fileKey)] as const,
      ),
    ),
  );
  return messages.map((message) =>
    message.role !== "user"
      ? message
      : {
          ...message,
          parts: message.parts.map((part) =>
            part.type === "file"
              ? { ...part, url: signed.get(part.url)! }
              : part,
          ),
        },
  );
}
