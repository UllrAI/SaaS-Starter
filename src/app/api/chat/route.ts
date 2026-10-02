import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateUIMessages } from "ai";
import { isAgentId } from "@/lib/ai/agents";
import {
  AiAttachmentValidationError,
  requireOwnedAiImageAttachments,
} from "@/lib/ai/chat-attachments";
import {
  AiConversationNotFoundError,
  requireAiConversation,
} from "@/lib/ai/chat-history";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { aiRunSummary } from "@/lib/ai/durable-runs";
import {
  beginAiRun,
  AiBudgetExceededError,
  AiRunConflictError,
} from "@/lib/ai/runs";
import { AiTranscriptConflictError } from "@/lib/ai/transcript";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
} from "@/lib/ai/reasoning";
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

const chatRequestSchema = z
  .object({
    messages: z.array(z.unknown()).max(MAX_CHAT_MESSAGES).default([]),
    retryRunId: z.uuid().optional(),
    conversationId: z.uuid(),
    requestId: z.uuid(),
    agentId: z.string().default("assistant"),
    reasoningEffort: z
      .enum(REASONING_EFFORTS)
      .default(DEFAULT_REASONING_EFFORT),
    parentMessageId: z.string().min(1).max(200).nullable().default(null),
  })
  .refine((data) =>
    data.retryRunId ? data.messages.length === 0 : data.messages.length > 0,
  );

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

  try {
    await requireAiConversation({
      conversationId: parsed.data.conversationId,
      userId: session.user.id,
    });
  } catch (error) {
    if (error instanceof AiConversationNotFoundError) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 },
      );
    }
    throw error;
  }

  let validatedMessages: AiMessage[];
  try {
    validatedMessages = parsed.data.retryRunId
      ? []
      : await validateUIMessages<AiMessage>({
          messages: parsed.data.messages,
        });
  } catch (error) {
    console.error("AI chat messages failed validation:", error);
    return NextResponse.json(
      { error: "Invalid chat request." },
      { status: 400 },
    );
  }

  try {
    await requireOwnedAiImageAttachments({
      messages: validatedMessages,
      userId: session.user.id,
    });
  } catch (error) {
    if (error instanceof AiAttachmentValidationError) {
      return NextResponse.json(
        { error: "Invalid chat request." },
        { status: 400 },
      );
    }
    throw error;
  }

  try {
    const accepted = await beginAiRun({
      userId: session.user.id,
      conversationId: parsed.data.conversationId,
      messages: validatedMessages,
      parentMessageId: parsed.data.parentMessageId,
      requestId: parsed.data.requestId,
      ...(parsed.data.retryRunId ? { retryRunId: parsed.data.retryRunId } : {}),
      agentId: parsed.data.agentId,
      reasoningEffort: parsed.data.reasoningEffort,
      locale: await getRequestLocale(),
    });
    return NextResponse.json(aiRunSummary(accepted.run), {
      status: 202,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    if (error instanceof AiBudgetExceededError)
      return NextResponse.json(
        { code: "ai_budget_reached", error: "Daily AI allowance reached." },
        { status: 429 },
      );
    if (
      error instanceof AiRunConflictError ||
      error instanceof AiTranscriptConflictError
    )
      return NextResponse.json(
        {
          code:
            error instanceof AiTranscriptConflictError
              ? error.code
              : "ai_run_conflict",
          error: error.message,
        },
        { status: 409 },
      );
    // Rejection before streaming starts, e.g. malformed UI messages.
    console.error("AI chat request failed:", error);
    return NextResponse.json(
      { error: "Unable to start the assistant. Please try again." },
      { status: 500 },
    );
  }
}
