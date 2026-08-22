import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAiConversation,
  setAiConversationArchived,
} from "@/lib/ai/chat-history";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const conversationIdSchema = z.uuid();
const archiveSchema = z.object({ archived: z.boolean() }).strict();
const MAX_ARCHIVE_BODY_BYTES = 1024;

async function readOwnedConversationRequest(
  request: NextRequest,
  params: Promise<{ conversationId: string }>,
) {
  if (!SITE_CONFIG.features.ai) {
    return {
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  }

  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const parsed = conversationIdSchema.safeParse((await params).conversationId);
  if (!parsed.success) {
    return {
      response: NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      ),
    };
  }

  return { conversationId: parsed.data, userId: session.user.id };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const resolved = await readOwnedConversationRequest(request, params);
  if ("response" in resolved) return resolved.response;

  const detail = await getAiConversation({
    conversationId: resolved.conversationId,
    userId: resolved.userId,
  });
  if (!detail) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(detail, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const resolved = await readOwnedConversationRequest(request, params);
  if ("response" in resolved) return resolved.response;

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(request, MAX_ARCHIVE_BODY_BYTES);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }

  const parsed = archiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const conversation = await setAiConversationArchived({
    conversationId: resolved.conversationId,
    userId: resolved.userId,
    archived: parsed.data.archived,
  });
  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { conversation },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
