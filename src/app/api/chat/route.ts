import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAgentUIStreamResponse } from "ai";
import { createAgent, isAgentId } from "@/lib/ai/agents";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_CHAT_BODY_BYTES = 512 * 1024;
const MAX_CHAT_MESSAGES = 80;
const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(MAX_CHAT_MESSAGES),
  agentId: z.string().default("assistant"),
});

export async function POST(request: NextRequest) {
  if (!SITE_CONFIG.features.ai) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    scope: "ai_chat",
    key: session.user.id,
    limit: CHAT_RATE_LIMIT,
    windowMs: CHAT_RATE_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      rateLimit.info.resetAt - Math.ceil(Date.now() / 1000),
      1,
    );
    return NextResponse.json(
      { error: "Too many chat requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(request, MAX_CHAT_BODY_BYTES);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RequestBodyTooLargeError
            ? "Request body is too large."
            : "Request body must be valid JSON.",
      },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success || !isAgentId(parsed.data.agentId)) {
    return NextResponse.json(
      { error: "Invalid chat request." },
      { status: 400 },
    );
  }

  let agent: ReturnType<typeof createAgent>;
  try {
    agent = createAgent(parsed.data.agentId, {
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      userRole: session.user.role,
      locale: await getRequestLocale(),
    });
  } catch (error) {
    // Misconfigured model or agent definition: never leak the details.
    console.error("AI agent could not be created:", error);
    return NextResponse.json(
      { error: "The assistant is unavailable." },
      { status: 500 },
    );
  }

  try {
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: parsed.data.messages,
      onError: (error) => {
        console.error("AI chat stream error:", error);
        // Keep provider error details out of the client stream.
        return "The assistant hit an unexpected error. Please try again.";
      },
    });
  } catch (error) {
    // Rejection before streaming starts, e.g. malformed UI messages.
    console.error("AI chat request failed:", error);
    return NextResponse.json(
      { error: "Invalid chat request." },
      { status: 400 },
    );
  }
}
