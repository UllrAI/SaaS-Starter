import "server-only";

import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/database";
import { aiConversations, aiMessages } from "@/database/schema";
import type {
  AiConversationDetail,
  AiConversationPage,
  AiConversationSummary,
  AiMessage,
} from "./chat-history-types";

const MAX_GENERATED_TITLE_LENGTH = 80;

export class AiConversationNotFoundError extends Error {
  constructor() {
    super("AI conversation not found.");
    this.name = "AiConversationNotFoundError";
  }
}

function toSummary(
  row: typeof aiConversations.$inferSelect,
): AiConversationSummary {
  return {
    id: row.id,
    title: row.title,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessage(row: typeof aiMessages.$inferSelect): AiMessage {
  return {
    id: row.id,
    role: row.role,
    parts: row.parts as AiMessage["parts"],
    ...(row.metadata
      ? { metadata: row.metadata as AiMessage["metadata"] }
      : {}),
  };
}

function readMessageTitle(message: AiMessage): string | null {
  if (message.role !== "user") return null;

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const fileName = message.parts
    .flatMap((part) =>
      part.type === "file" && part.filename?.trim()
        ? [part.filename.trim()]
        : [],
    )
    .at(0);
  const title = text || fileName;

  if (!title) return null;
  return Array.from(title).slice(0, MAX_GENERATED_TITLE_LENGTH).join("");
}

async function findOwnedConversation(conversationId: string, userId: string) {
  const [conversation] = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, userId),
      ),
    )
    .limit(1);

  return conversation;
}

export async function createAiConversation(
  userId: string,
): Promise<AiConversationSummary> {
  const [conversation] = await db
    .insert(aiConversations)
    .values({ userId })
    .returning();

  if (!conversation) {
    throw new Error("Failed to create AI conversation.");
  }

  return toSummary(conversation);
}

export async function listAiConversations(params: {
  userId: string;
  offset: number;
  limit: number;
  archived: boolean;
}): Promise<AiConversationPage> {
  const rows = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, params.userId),
        params.archived
          ? isNotNull(aiConversations.archivedAt)
          : isNull(aiConversations.archivedAt),
      ),
    )
    .orderBy(desc(aiConversations.updatedAt), desc(aiConversations.id))
    .limit(params.limit + 1)
    .offset(params.offset);

  return {
    conversations: rows.slice(0, params.limit).map(toSummary),
    hasMore: rows.length > params.limit,
  };
}

export async function setAiConversationArchived(params: {
  conversationId: string;
  userId: string;
  archived: boolean;
}): Promise<AiConversationSummary | null> {
  const [conversation] = await db
    .update(aiConversations)
    .set({
      archivedAt: params.archived ? sql<Date>`now()` : null,
    })
    .where(
      and(
        eq(aiConversations.id, params.conversationId),
        eq(aiConversations.userId, params.userId),
      ),
    )
    .returning();

  return conversation ? toSummary(conversation) : null;
}

export async function getAiConversation(params: {
  conversationId: string;
  userId: string;
  before?: string;
}): Promise<AiConversationDetail | null> {
  const conversation = await findOwnedConversation(
    params.conversationId,
    params.userId,
  );
  if (!conversation) return null;

  const messages = await db
    .select()
    .from(aiMessages)
    .where(
      and(
        eq(aiMessages.conversationId, conversation.id),
        params.before
          ? sql`(${aiMessages.createdAt}, ${aiMessages.id}) < (select "createdAt", id from ai_messages where "conversationId" = ${conversation.id} and id = ${params.before})`
          : undefined,
      ),
    )
    .orderBy(desc(aiMessages.createdAt), desc(aiMessages.id))
    .limit(81);

  return {
    conversation: toSummary(conversation),
    messages: messages.slice(0, 80).reverse().map(toMessage),
    hasMore: messages.length > 80,
  };
}

export async function requireAiConversation(params: {
  conversationId: string;
  userId: string;
}): Promise<void> {
  const conversation = await findOwnedConversation(
    params.conversationId,
    params.userId,
  );
  if (!conversation) throw new AiConversationNotFoundError();
}

export async function saveAiMessages(params: {
  conversationId: string;
  userId: string;
  messages: AiMessage[];
}): Promise<void> {
  if (params.messages.length === 0) return;

  const conversation = await findOwnedConversation(
    params.conversationId,
    params.userId,
  );
  if (!conversation) throw new AiConversationNotFoundError();

  const generatedTitle = conversation.title
    ? null
    : (params.messages.map(readMessageTitle).find(Boolean) ?? null);

  await db.transaction(async (tx) => {
    for (const message of params.messages) {
      const insert = tx.insert(aiMessages).values({
        id: message.id,
        conversationId: conversation.id,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata ?? null,
      });

      if (message.role === "user") {
        await insert.onConflictDoNothing({
          target: [aiMessages.conversationId, aiMessages.id],
        });
        continue;
      }

      await insert.onConflictDoUpdate({
        target: [aiMessages.conversationId, aiMessages.id],
        set: {
          runId: null,
          role: message.role,
          parts: message.parts,
          metadata: message.metadata ?? null,
        },
        setWhere: eq(aiMessages.role, message.role),
      });
    }

    await tx
      .update(aiConversations)
      .set({
        updatedAt: sql<Date>`now()`,
        ...(generatedTitle
          ? {
              title: sql<string>`coalesce(${aiConversations.title}, ${generatedTitle})`,
            }
          : {}),
      })
      .where(
        and(
          eq(aiConversations.id, conversation.id),
          eq(aiConversations.userId, params.userId),
        ),
      );
  });
}
