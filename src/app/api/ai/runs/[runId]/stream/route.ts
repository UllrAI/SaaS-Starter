import { NextRequest, NextResponse } from "next/server";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { db } from "@/database";
import { readOwnedAiRunRequest } from "@/lib/ai/run-route";
import { createAiRunEventStream } from "@/lib/ai/event-stream";
import { acquireAiStreamLease } from "@/lib/ai/stream-leases";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const resolved = await readOwnedAiRunRequest(request, params);
  if ("response" in resolved) return resolved.response;
  const raw =
    request.nextUrl.searchParams.get("cursor") ??
    request.headers.get("Last-Event-ID") ??
    "0";
  const cursor = Number(raw);
  if (
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(cursor) ||
    cursor > resolved.run.lastEventId
  ) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }
  const lease = await acquireAiStreamLease(db, resolved.userId);
  if (!lease) {
    return NextResponse.json(
      { error: "Too many active run streams", code: "AI_STREAM_LIMIT" },
      {
        status: 429,
        headers: { "Retry-After": "1", "Cache-Control": "private, no-store" },
      },
    );
  }
  return new Response(
    createAiRunEventStream(
      db,
      resolved.run.id,
      resolved.userId,
      cursor,
      request.signal,
      lease,
    ),
    {
      headers: {
        ...UI_MESSAGE_STREAM_HEADERS,
        "Cache-Control": "private, no-cache, no-store",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
