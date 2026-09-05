import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeStream,
  createAgentUIStreamResponse,
  generateId,
  InvalidToolApprovalError,
  InvalidToolApprovalSignatureError,
  ToolCallNotFoundForApprovalError,
  validateUIMessages,
  type LanguageModelUsage,
} from "ai";

import { createAgent, isAgentId } from "@/lib/ai/agents";
import {
  AiAttachmentValidationError,
  requireOwnedAiImageAttachments,
  resolveAiImageAttachments,
} from "@/lib/ai/chat-attachments";
import {
  AiConversationNotFoundError,
  requireAiConversation,
  getAiConversation,
  saveAiMessages,
} from "@/lib/ai/chat-history";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { db } from "@/database";
import { storeFile } from "@/lib/uploads/server-storage";
import { finalizeAiRun } from "@/lib/ai/finalize";
import {
  beginAiRun,
  completeAiRun,
  failAiRun,
  AiBudgetExceededError,
  AiRunConflictError,
} from "@/lib/ai/runs";
import {
  mergeAiTranscript,
  AiTranscriptConflictError,
} from "@/lib/ai/transcript";
import { AI_RUN_TIMEOUT_MS, AI_MAX_CONTEXT_BYTES } from "@/lib/ai/limits";
import { selectGptImage1kSize } from "@/lib/ai/image-size";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
} from "@/lib/ai/reasoning";
import {
  createResponseHandle,
  readResponseHandle,
} from "@/lib/ai/response-chain";
import { AI_MODEL_UNREPORTED, extractUsageTotals } from "@/lib/ai/usage";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { withSseKeepAlive } from "@/lib/http/sse-keep-alive";
import { getRequestLocale } from "@/lib/i18n/server-locale";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_CHAT_BODY_BYTES = 512 * 1024;
const MAX_CHAT_MESSAGES = 80;
const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 10 * 60 * 1000;

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(MAX_CHAT_MESSAGES),
  conversationId: z.uuid(),
  requestId: z.uuid(),
  agentId: z.string().default("assistant"),
  reasoningEffort: z.enum(REASONING_EFFORTS).default(DEFAULT_REASONING_EFFORT),
  parentMessageId: z.string().min(1).max(200).nullable().default(null),
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
    validatedMessages = await validateUIMessages<AiMessage>({
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

  let runId: string | undefined;
  let providerStarted = false;
  try {
    const accepted = await beginAiRun({
      userId: session.user.id,
      conversationId: parsed.data.conversationId,
      messages: validatedMessages,
      parentMessageId: parsed.data.parentMessageId,
      requestId: parsed.data.requestId,
    });
    runId = accepted.run.id;
    const detail = await getAiConversation({
      userId: session.user.id,
      conversationId: parsed.data.conversationId,
    });
    if (!detail)
      throw new AiTranscriptConflictError("Conversation unavailable.");
    if (detail.hasMore)
      throw new AiTranscriptConflictError(
        "Conversation context is full. Start a new conversation.",
        "ai_context_full",
      );
    validatedMessages = mergeAiTranscript(
      detail.messages,
      validatedMessages,
      parsed.data.parentMessageId,
    );
    if (
      Buffer.byteLength(JSON.stringify(validatedMessages), "utf8") >
      AI_MAX_CONTEXT_BYTES
    )
      throw new AiTranscriptConflictError(
        "Conversation context is full. Start a new conversation.",
        "ai_context_full",
      );
    let previousResponseId: string | undefined;
    let responseIndex = -1;
    for (let index = validatedMessages.length - 2; index >= 0; index--) {
      const candidate = validatedMessages[index];
      if (candidate.role !== "assistant" || !candidate.metadata?.responseHandle)
        continue;
      previousResponseId =
        readResponseHandle(
          candidate.metadata.responseHandle,
          session.user.id,
          parsed.data.conversationId,
        ) ?? undefined;
      if (previousResponseId) responseIndex = index;
      break;
    }
    const agent = createAgent(
      parsed.data.agentId,
      {
        userId: session.user.id,
        conversationId: parsed.data.conversationId,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: session.user.role,
        locale: await getRequestLocale(),
      },
      {
        reasoningEffort: parsed.data.reasoningEffort,
        imageSize: selectGptImage1kSize(validatedMessages),
        previousResponseId,
        allowImageGeneration: accepted.allowImageGeneration,
      },
    );
    await saveAiMessages({
      conversationId: parsed.data.conversationId,
      userId: session.user.id,
      messages: validatedMessages.slice(-1),
    });
    validatedMessages = validatedMessages.slice(responseIndex + 1);
    // `onEnd` carries `finishReason` but no token counts, so the metadata
    // callback captures what it lacks: `finish` reports the turn total and
    // `finish-step` the model that actually served it.
    const startedAt = Date.now();
    let usage: LanguageModelUsage | undefined;
    let responseModelId: string | undefined;

    validatedMessages = await resolveAiImageAttachments(
      validatedMessages,
      session.user.id,
    );
    providerStarted = true;
    const response = await createAgentUIStreamResponse({
      abortSignal: request.signal
        ? AbortSignal.any([
            request.signal,
            AbortSignal.timeout(AI_RUN_TIMEOUT_MS),
          ])
        : AbortSignal.timeout(AI_RUN_TIMEOUT_MS),
      agent,
      uiMessages: validatedMessages,
      generateMessageId: generateId,
      sendSources: true,
      consumeSseStream: async ({ stream }) => {
        try {
          await consumeStream({
            stream,
            onError: (error) => {
              console.error("AI chat background stream error:", error);
            },
          });
        } finally {
          await failAiRun(accepted.run.id, true).catch(console.error);
        }
      },
      onEnd: async ({ responseMessage, finishReason }) => {
        const message = responseMessage as AiMessage;
        await completeAiRun(accepted.run.id, message, {
          userId: session.user.id,
          conversationId: parsed.data.conversationId,
          messageId: message.id,
          agentId: parsed.data.agentId,
          model: responseModelId ?? AI_MODEL_UNREPORTED,
          reasoningEffort: parsed.data.reasoningEffort,
          finishReason,
          durationMs: Date.now() - startedAt,
          ...extractUsageTotals(usage),
        });
        try {
          await finalizeAiRun(db, accepted.run.id, storeFile);
        } catch (error) {
          console.error("AI response saved; finalization will retry:", error);
        }
      },
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          usage = part.totalUsage;
          return undefined;
        }
        if (part.type !== "finish-step") return undefined;
        responseModelId = part.response.modelId;
        return {
          responseHandle: createResponseHandle(
            part.response.id,
            session.user.id,
            parsed.data.conversationId,
          ),
        };
      },
      onError: (error) => {
        console.error("AI chat stream error:", error);
        // A tool approval the server never signed, or one pointing at a tool
        // call that does not exist: the client tampered with the transcript.
        // The loop already refused to execute the tool; say so without hinting
        // at what would make the forgery pass.
        if (
          error instanceof InvalidToolApprovalSignatureError ||
          error instanceof InvalidToolApprovalError ||
          error instanceof ToolCallNotFoundForApprovalError
        ) {
          return "That approval could not be verified. Please send the request again.";
        }
        // Keep provider error details out of the client stream.
        return "The assistant hit an unexpected error. Please try again.";
      },
    });
    return withSseKeepAlive(response);
  } catch (error) {
    if (runId) await failAiRun(runId, providerStarted).catch(console.error);
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
