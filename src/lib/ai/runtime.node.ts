import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { aiConversations, users } from "@/database/schema";
import { getUserSubscriptionFromDatabase } from "@/lib/database/subscription-read";
import { createFileStorage } from "@/lib/uploads/store";
import type { SupportedLocale } from "@/lib/config/i18n";
import { createAgent, type AgentId, type CreateAgentOptions } from "./agents";
import { resolveAiImageAttachments } from "./chat-attachments.node";
import type { AgentContext } from "./context";
import type { AiMessage } from "./chat-history-types";
import { createAiModels, type AiModelConfig } from "./models.node";
import { createResponseHandle, readResponseHandle } from "./response-chain";

export interface WorkerAiRuntimeConfig {
  model: AiModelConfig;
  approvalSecret: string;
  storage?: Parameters<typeof createFileStorage>[1];
}

export function createWorkerAiRuntime(
  db: AppDatabase,
  config: WorkerAiRuntimeConfig,
) {
  // The SDK silently disables approval verification when this is absent.
  if (!config.approvalSecret)
    throw new Error("AI Worker requires BETTER_AUTH_SECRET.");
  const models = createAiModels(config.model);
  const storage = config.storage;
  const client = storage
    ? new S3Client({
        region: "auto",
        endpoint: storage.endpoint,
        credentials: {
          accessKeyId: storage.accessKeyId,
          secretAccessKey: storage.secretAccessKey,
        },
      })
    : undefined;
  const storeFile = storage
    ? createFileStorage(db, storage)
    : async () => {
        throw new Error("AI file storage is unavailable.");
      };
  const dependencies = {
    models,
    approvalSecret: config.approvalSecret,
    storeFile,
    getUserSubscription: (userId: string) =>
      getUserSubscriptionFromDatabase(db, userId),
  };

  return {
    storeFile,
    async getContext(
      userId: string,
      conversationId: string,
      locale: SupportedLocale,
    ): Promise<AgentContext> {
      const [row] = await db
        .select({ user: users })
        .from(users)
        .innerJoin(
          aiConversations,
          and(
            eq(aiConversations.userId, users.id),
            eq(aiConversations.id, conversationId),
          ),
        )
        .where(eq(users.id, userId))
        .limit(1);
      if (
        !row ||
        (row.user.banned &&
          (!row.user.banExpires || row.user.banExpires > new Date()))
      ) {
        throw new Error("AI conversation is unavailable.");
      }
      return {
        userId,
        conversationId,
        locale,
        userName: row.user.name,
        userEmail: row.user.email,
        userRole: row.user.role,
      };
    },
    createAgent(
      agentId: AgentId,
      context: AgentContext,
      options: CreateAgentOptions,
    ) {
      return createAgent(
        agentId,
        context,
        {
          ...options,
          allowImageGeneration:
            Boolean(storage) && options.allowImageGeneration !== false,
        },
        dependencies,
      );
    },
    resolveAttachments(messages: AiMessage[], userId: string) {
      return resolveAiImageAttachments(
        db,
        async (key) => {
          if (!client || !storage)
            throw new Error("AI attachment storage is unavailable.");
          return getSignedUrl(
            client,
            new GetObjectCommand({ Bucket: storage.bucketName, Key: key }),
            { expiresIn: 300 },
          );
        },
        messages,
        userId,
      );
    },
    createResponseHandle: (
      responseId: string,
      userId: string,
      conversationId: string,
    ) =>
      createResponseHandle(
        responseId,
        userId,
        conversationId,
        config.approvalSecret,
      ),
    readResponseHandle: (
      handle: string,
      userId: string,
      conversationId: string,
    ) =>
      readResponseHandle(handle, userId, conversationId, config.approvalSecret),
  };
}
