import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import env from "@/env";
import {
  cleanupExpiredUploadIntents,
  recoverStaleUploadCleanupClaims,
} from "@/lib/uploads/upload-intents";

function isAuthorized(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(env.UPLOAD_CLEANUP_SECRET);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recovered = await recoverStaleUploadCleanupClaims();
    const result = await cleanupExpiredUploadIntents();
    return NextResponse.json({ recovered, ...result });
  } catch (error) {
    console.error("Upload intent cleanup failed:", error);
    return NextResponse.json(
      { error: "Upload cleanup failed." },
      { status: 500 },
    );
  }
}
