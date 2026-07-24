import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import env from "@/env";
import {
  cleanupExpiredUploadIntents,
  recoverStaleUploadCleanupClaims,
} from "@/lib/uploads/upload-intents";

const CLEANUP_BATCH_SIZE = 100;
const MAX_CLEANUP_BATCHES = 5;

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
    const totals = {
      scanned: 0,
      deleted: 0,
      deferred: 0,
      failed: 0,
      batches: 0,
    };

    for (let batch = 0; batch < MAX_CLEANUP_BATCHES; batch += 1) {
      const result = await cleanupExpiredUploadIntents(CLEANUP_BATCH_SIZE);
      totals.scanned += result.scanned;
      totals.deleted += result.deleted;
      totals.deferred += result.deferred;
      totals.failed += result.failed;
      totals.batches += 1;

      if (result.scanned < CLEANUP_BATCH_SIZE) {
        break;
      }
    }

    return NextResponse.json({ recovered, ...totals });
  } catch (error) {
    console.error("Upload intent cleanup failed:", error);
    return NextResponse.json(
      { error: "Upload cleanup failed." },
      { status: 500 },
    );
  }
}
