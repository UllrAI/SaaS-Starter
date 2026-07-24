import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateApiKey, listApiKeys } from "@/lib/api-keys/key-service";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_API_KEY_BODY_BYTES = 4 * 1024;
const API_KEY_CREATE_LIMIT = 10;
const API_KEY_CREATE_WINDOW_MS = 60 * 60 * 1000;

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  rateLimit: z.coerce.number().int().positive().max(600).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listApiKeys(session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit({
    scope: "api_key_create",
    key: session.user.id,
    limit: API_KEY_CREATE_LIMIT,
    windowMs: API_KEY_CREATE_WINDOW_MS,
  });
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(
      rateLimit.info.resetAt - Math.ceil(Date.now() / 1000),
      1,
    );
    return NextResponse.json(
      { error: "Too many API key requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(request, MAX_API_KEY_BODY_BYTES);
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
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const result = await generateApiKey({
    userId: session.user.id,
    name: parsed.data.name,
    rateLimit: parsed.data.rateLimit,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });

  return NextResponse.json(result, { status: 201 });
}
