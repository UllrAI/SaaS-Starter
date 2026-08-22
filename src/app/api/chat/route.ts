import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeStream,
  createAgentUIStreamResponse,
  validateUIMessages,
} from "ai";
import { createAgent, isAgentId } from "@/lib/ai/agents";
import {
  AiConversationNotFoundError,
  requireAiConversation,
  saveAiMessages,
} from "@/lib/ai/chat-history";
import type { AiMessage } from "@/lib/ai/chat-history-types";
import { persistGeneratedImages } from "@/lib/ai/generated-image-storage";
import { selectGptImage1kSize } from "@/lib/ai/image-size";
import {
  DEFAULT_REASONING_EFFORT,
  REASONING_EFFORTS,
} from "@/lib/ai/reasoning";
import {
  createResponseHandle,
  readResponseHandle,
} from "@/lib/ai/response-chain";
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
  agentId: z.string().default("assistant"),
  reasoningEffort: z.enum(REASONING_EFFORTS).default(DEFAULT_REASONING_EFFORT),
  responseHandle: z.string().max(512).optional(),
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

  const previousResponseId = parsed.data.responseHandle
    ? (readResponseHandle(parsed.data.responseHandle, session.user.id) ??
      undefined)
    : undefined;
  if (parsed.data.responseHandle && !previousResponseId) {
    return NextResponse.json(
      { error: "Invalid response handle." },
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

  let agent: ReturnType<typeof createAgent>;
  try {
    agent = createAgent(
      parsed.data.agentId,
      {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: session.user.role,
        locale: await getRequestLocale(),
      },
      {
        reasoningEffort: parsed.data.reasoningEffort,
        imageSize: selectGptImage1kSize(validatedMessages),
        previousResponseId,
      },
    );
  } catch (error) {
    // Misconfigured model or agent definition: never leak the details.
    console.error("AI agent could not be created:", error);
    return NextResponse.json(
      { error: "The assistant is unavailable." },
      { status: 500 },
    );
  }

  try {
    await saveAiMessages({
      conversationId: parsed.data.conversationId,
      userId: session.user.id,
      messages: validatedMessages.filter((message) => message.role === "user"),
    });
  } catch (error) {
    console.error("AI chat message could not be saved:", error);
    return NextResponse.json(
      { error: "The conversation could not be saved." },
      { status: 500 },
    );
  }

  try {
    const response = await createAgentUIStreamResponse({
      agent,
      uiMessages: validatedMessages,
      sendSources: true,
      consumeSseStream: ({ stream }) =>
        consumeStream({
          stream,
          onError: (error) => {
            console.error("AI chat background stream error:", error);
          },
        }),
      onEnd: async ({ responseMessage }) => {
        const message = await persistGeneratedImages({
          message: responseMessage as AiMessage,
          userId: session.user.id,
        });
        await saveAiMessages({
          conversationId: parsed.data.conversationId,
          userId: session.user.id,
          messages: [message],
        });
      },
      messageMetadata: ({ part }) =>
        part.type === "finish-step"
          ? {
              responseHandle: createResponseHandle(
                part.response.id,
                session.user.id,
              ),
            }
          : undefined,
      onError: (error) => {
        console.error("AI chat stream error:", error);
        // Keep provider error details out of the client stream.
        return "The assistant hit an unexpected error. Please try again.";
      },
    });
    return withSseKeepAlive(response);
  } catch (error) {
    // Rejection before streaming starts, e.g. malformed UI messages.
    console.error("AI chat request failed:", error);
    return NextResponse.json(
      { error: "Invalid chat request." },
      { status: 400 },
    );
  }
}
