import { tool } from "ai";
import { z } from "zod";
import { isFileSizeAllowed } from "@/lib/config/upload";
import { storeFile } from "@/lib/uploads/server-storage";
import {
  UploadQuotaExceededError,
  UploadFileDeletedError,
} from "@/lib/uploads/repository";
import type { AgentContext } from "../context";

const DOCUMENT_CONTENT_TYPE = "text/markdown";
const MAX_DOCUMENT_CHARS = 100_000;

function toMarkdownFileName(fileName: string) {
  // The model chooses the name, so strip anything that could escape the
  // per-user key prefix and force the extension the content type declares.
  const base = fileName
    .replace(/[\\/]+/g, "-")
    .replace(/\.md$/i, "")
    .trim();
  return `${base || "document"}.md`;
}

export function createSaveDocument(context: AgentContext) {
  return tool({
    description:
      "Save a Markdown document to the user's files. Use it only when the user asks to save, export, or keep a document; use presentArtifact to merely show one. The saved file counts against the user's storage quota and can be deleted from the Files page.",
    inputSchema: z.object({
      fileName: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .describe('File name without a path, for example "meeting-notes".'),
      content: z
        .string()
        .trim()
        .min(1)
        .max(MAX_DOCUMENT_CHARS)
        .describe("The full Markdown body of the document."),
    }),
    needsApproval: true,
    execute: async ({ fileName, content }, { toolCallId }) => {
      const body = Buffer.from(content, "utf8");
      if (!isFileSizeAllowed(body.byteLength)) {
        return { error: "The document is too large to save." };
      }

      let record;
      try {
        record = await storeFile({
          userId: context.userId,
          identity: `document:${context.conversationId}:${toolCallId}`,
          fileName: toMarkdownFileName(fileName),
          contentType: DOCUMENT_CONTENT_TYPE,
          body,
        });
      } catch (error) {
        if (error instanceof UploadFileDeletedError)
          return {
            error:
              "This file was deleted. Ask to save it again as a new document.",
          };
        if (error instanceof UploadQuotaExceededError)
          return {
            error:
              "Storage allowance reached. Delete unused files and try again.",
          };
        throw error;
      }

      return {
        fileName: record.fileName,
        fileSize: record.fileSize,
        url: record.url,
      };
    },
  });
}
