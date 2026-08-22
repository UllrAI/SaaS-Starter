import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createAiConversation,
  listAiConversations,
} from "@/lib/ai/chat-history";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import { checkRateLimit } from "@/lib/rate-limit";

const querySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  archived: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const CREATE_LIMIT = 30;
const CREATE_WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  if (!SITE_CONFIG.features.ai) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    offset: request.nextUrl.searchParams.get("offset") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    archived: request.nextUrl.searchParams.get("archived") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query." }, { status: 400 });
  }

  const page = await listAiConversations({
    userId: session.user.id,
    ...parsed.data,
  });
  return NextResponse.json(page, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  if (!SITE_CONFIG.features.ai) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    scope: "ai_conversation_create",
    key: session.user.id,
    limit: CREATE_LIMIT,
    windowMs: CREATE_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      rateLimit.info.resetAt - Math.ceil(Date.now() / 1000),
      1,
    );
    return NextResponse.json(
      { error: "Too many conversations. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const conversation = await createAiConversation(session.user.id);
  return NextResponse.json(
    { conversation },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  );
}
