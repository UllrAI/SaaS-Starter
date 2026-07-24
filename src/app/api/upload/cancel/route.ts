import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { UPLOAD_CONFIG, uploadCancelRequestSchema } from "@/lib/config/upload";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { checkUploadRateLimit } from "@/lib/upload-rate-limit";
import { cancelUploadIntent } from "@/lib/uploads/upload-intents";

export async function POST(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkUploadRateLimit(session.user.id, "cancel");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter) },
      },
    );
  }

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(
      request,
      UPLOAD_CONFIG.MAX_JSON_BODY_SIZE,
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RequestBodyTooLargeError
            ? "Upload request is too large."
            : "Request body must be valid JSON.",
      },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }

  const parsed = uploadCancelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid upload intent." },
      { status: 400 },
    );
  }

  await cancelUploadIntent(parsed.data.intentId, session.user.id);
  return NextResponse.json({ success: true });
}
