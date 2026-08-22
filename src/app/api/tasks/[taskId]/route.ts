import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { getOwnedTaskRun } from "@/lib/tasks/repository";
import { getUserScopeKey, serializeTaskRun } from "@/lib/tasks/types";

const taskRunIdSchema = z.uuid();

async function resolveOwnedTask(
  request: NextRequest,
  params: Promise<{ taskId: string }>,
) {
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const parsedId = taskRunIdSchema.safeParse((await params).taskId);
  if (!parsedId.success) {
    return {
      response: NextResponse.json(
        { error: "Task not found." },
        { status: 404 },
      ),
    };
  }

  const scopeKey = getUserScopeKey(session.user.id);
  const taskRun = await getOwnedTaskRun(db, parsedId.data, scopeKey);
  if (!taskRun) {
    return {
      response: NextResponse.json(
        { error: "Task not found." },
        { status: 404 },
      ),
    };
  }

  return { taskRun, scopeKey };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const resolved = await resolveOwnedTask(request, params);
  if ("response" in resolved) return resolved.response;

  return NextResponse.json(
    { task: serializeTaskRun(resolved.taskRun) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
