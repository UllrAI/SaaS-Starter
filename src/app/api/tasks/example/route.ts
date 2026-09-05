import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { exampleProcessJob } from "@/lib/jobs/example";
import { serverJobQueue } from "@/lib/jobs/server";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import {
  TaskInputConflictError,
  TaskCapacityError,
} from "@/lib/tasks/repository";
import { checkRateLimit } from "@/lib/rate-limit";
import { createBackgroundTask } from "@/lib/tasks/service";
import { getUserScopeKey, serializeTaskRun } from "@/lib/tasks/types";

const requestSchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    idempotencyKey: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
const MAX_REQUEST_BYTES = 2048;

export async function POST(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit({
    scope: "background_tasks",
    key: session.user.id,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Too many task requests." },
      { status: 429 },
    );

  let body: unknown;
  try {
    body = await readJsonBodyWithLimit(request, MAX_REQUEST_BYTES);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { taskRun, created } = await createBackgroundTask({
      db,
      queue: serverJobQueue,
      definition: exampleProcessJob,
      scopeKey: getUserScopeKey(session.user.id),
      payload: { message: parsed.data.message },
      idempotencyKey: parsed.data.idempotencyKey,
    });

    return NextResponse.json(
      { task: serializeTaskRun(taskRun) },
      {
        status: created ? 202 : 200,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    if (error instanceof TaskCapacityError)
      return NextResponse.json({ error: error.message }, { status: 429 });
    if (error instanceof TaskInputConflictError)
      return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Failed to create background task", error);
    return NextResponse.json(
      { error: "Background task service is unavailable." },
      { status: 503 },
    );
  }
}
