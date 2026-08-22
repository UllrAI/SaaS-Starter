import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAiConversation } from "@/lib/ai/chat-history";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";

const conversationIdSchema = z.uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  if (!SITE_CONFIG.features.ai) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = conversationIdSchema.safeParse((await params).conversationId);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 },
    );
  }

  const detail = await getAiConversation({
    conversationId: parsed.data,
    userId: session.user.id,
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
