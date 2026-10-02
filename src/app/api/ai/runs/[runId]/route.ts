import { NextResponse } from "next/server";
import { readOwnedAiRunRequest } from "@/lib/ai/run-route";
import { aiRunSummary } from "@/lib/ai/durable-runs";
import { withoutImageBytes } from "@/lib/ai/finalize";
import type { AiMessage } from "@/lib/ai/chat-history-types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const resolved = await readOwnedAiRunRequest(request, params);
  if ("response" in resolved) return resolved.response;
  return NextResponse.json(
    {
      ...aiRunSummary(resolved.run),
      retryMessage: resolved.run.input?.request.message ?? null,
      response: resolved.run.response
        ? withoutImageBytes(resolved.run.response as AiMessage)
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
