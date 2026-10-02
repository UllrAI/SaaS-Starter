import "server-only";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/database";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import { getOwnedAiRun } from "./durable-runs";

export async function readOwnedAiRunRequest(
  request: Request,
  params: Promise<{ runId: string }>,
) {
  if (!SITE_CONFIG.features.ai)
    return {
      response: NextResponse.json({ error: "Not found" }, { status: 404 }),
    };
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id)
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  const id = z.uuid().safeParse((await params).runId);
  const run = id.success
    ? await getOwnedAiRun(db, id.data, session.user.id)
    : null;
  if (!run)
    return {
      response: NextResponse.json({ error: "Run not found" }, { status: 404 }),
    };
  return { run, userId: session.user.id };
}
