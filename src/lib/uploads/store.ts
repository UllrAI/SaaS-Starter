import { createHash } from "node:crypto";
import {
  PutObjectCommand,
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { AppDatabase } from "@/database/client";
import {
  createUploadRepository,
  type UploadRepositoryConfig,
} from "./repository";
import { isFileSizeAllowed, isFileTypeAllowed } from "@/lib/config/upload";
import { buildFileUrl } from "./url";

export function createFileStorage(
  db: AppDatabase,
  config: UploadRepositoryConfig & {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
  },
) {
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const repository = createUploadRepository(
    db,
    config,
    buildFileUrl,
    async (key) => {
      try {
        await client.send(
          new DeleteObjectCommand({ Bucket: config.bucketName, Key: key }),
        );
        return { success: true };
      } catch {
        return { success: false, error: "Object deletion failed." };
      }
    },
  );
  return async (input: {
    userId: string;
    identity: string;
    fileName: string;
    contentType: string;
    body: Buffer;
  }) => {
    if (
      !isFileSizeAllowed(input.body.length) ||
      !isFileTypeAllowed(input.contentType)
    )
      throw new Error("Unsupported file type or size.");
    const digest = createHash("sha256")
      .update(input.userId)
      .update("\0")
      .update(input.identity)
      .update("\0")
      .update(input.body)
      .digest("hex");
    const intent = await repository.createUploadIntent({
      sourceKey: digest,
      userId: input.userId,
      fileName: input.fileName,
      fileSize: input.body.length,
      contentType: input.contentType,
    });
    if (intent.status !== "completed") {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: config.bucketName,
            Key: intent.fileKey,
            Body: input.body,
            ContentLength: input.body.length,
            ContentType: input.contentType,
            IfNoneMatch: "*",
          }),
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("$metadata" in error) ||
          (error.$metadata as { httpStatusCode?: number }).httpStatusCode !==
            412
        )
          throw error;
        const object = await client.send(
          new HeadObjectCommand({
            Bucket: config.bucketName,
            Key: intent.fileKey,
          }),
        );
        if (
          object.ContentLength !== input.body.length ||
          object.ContentType !== input.contentType
        )
          throw new Error("Stored file does not match the accepted upload.");
      }
    }
    return repository.completeUploadIntent({
      intentId: intent.id,
      userId: input.userId,
      key: intent.fileKey,
      contentLength: input.body.length,
      contentType: input.contentType,
    });
  };
}
