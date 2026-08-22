import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { serverJobQueue } from "@/lib/jobs/server";
import { cancelOwnedBackgroundTask } from "@/lib/tasks/service";
import { getUserScopeKey, serializeTaskRun } from "@/lib/tasks/types";

const taskRunIdSchema = z.uuid();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = taskRunIdSchema.safeParse((await params).taskId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const taskRun = await cancelOwnedBackgroundTask({
    db,
    queue: serverJobQueue,
    taskRunId: parsedId.data,
    scopeKey: getUserScopeKey(session.user.id),
  });
  if (!taskRun) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(
    { task: serializeTaskRun(taskRun) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
