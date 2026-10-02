import { NextResponse } from "next/server";
import { db } from "@/database";
import { readOwnedAiRunRequest } from "@/lib/ai/run-route";
import { aiRunSummary, cancelAiRun } from "@/lib/ai/durable-runs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const resolved = await readOwnedAiRunRequest(request, params);
  if ("response" in resolved) return resolved.response;
  const run = await cancelAiRun(db, resolved.run.id, resolved.userId);
  return NextResponse.json(aiRunSummary(run ?? resolved.run), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
