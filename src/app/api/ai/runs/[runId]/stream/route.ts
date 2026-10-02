import { NextRequest, NextResponse } from "next/server";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { db } from "@/database";
import { readOwnedAiRunRequest } from "@/lib/ai/run-route";
import { createAiRunEventStream } from "@/lib/ai/event-stream";

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
  return new Response(
    createAiRunEventStream(
      db,
      resolved.run.id,
      resolved.userId,
      cursor,
      request.signal,
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
