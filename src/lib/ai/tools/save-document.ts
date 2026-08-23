import { PutObjectCommand } from "@aws-sdk/client-s3";
import { tool } from "ai";
import { z } from "zod";
import { getUploadConfig } from "@/lib/config/integrations";
import { isFileSizeAllowed } from "@/lib/config/upload";
import { getR2Client } from "@/lib/r2";
import {
  completeUploadIntent,
  createUploadIntent,
  UploadQuotaExceededError,
} from "@/lib/uploads/upload-intents";
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
      "Save a Markdown document to the user's files. Use it only when the user asks to save, export, or keep a document; use presentArtifact to merely show one. The saved file counts against the user's storage quota and the user cannot delete it themselves.",
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
    execute: async ({ fileName, content }) => {
      const body = Buffer.from(content, "utf8");
      if (!isFileSizeAllowed(body.byteLength)) {
        return { error: "The document is too large to save." };
      }

      const documentName = toMarkdownFileName(fileName);
      let intent;
      try {
        intent = await createUploadIntent({
          userId: context.userId,
          fileName: documentName,
          fileSize: body.byteLength,
          contentType: DOCUMENT_CONTENT_TYPE,
        });
      } catch (error) {
        if (error instanceof UploadQuotaExceededError) {
          return {
            error: `The user's ${error.quota} storage quota is full, so the document was not saved.`,
          };
        }
        throw error;
      }

      await getR2Client().send(
        new PutObjectCommand({
          Bucket: getUploadConfig().bucketName,
          Key: intent.fileKey,
          Body: body,
          ContentLength: body.byteLength,
          ContentType: DOCUMENT_CONTENT_TYPE,
        }),
      );

      const record = await completeUploadIntent({
        intentId: intent.id,
        userId: context.userId,
        key: intent.fileKey,
        contentLength: body.byteLength,
        contentType: DOCUMENT_CONTENT_TYPE,
      });

      return {
        fileName: record.fileName,
        fileSize: record.fileSize,
        url: record.url,
      };
    },
  });
}
