import { and, eq } from "drizzle-orm";
import type { AppDatabase } from "@/database/client";
import { taskDispatches, taskRuns } from "@/database/schema";

export async function scheduleTaskContinuation(
  db: AppDatabase,
  input: {
    taskRunId: string;
    scopeKey: string;
    kind: string;
    payload: unknown;
    dispatchId: string;
    currentDispatchId?: string;
    startAfter?: Date | number;
    from: "running" | "waiting";
  },
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [task] = await tx
      .select()
      .from(taskRuns)
      .where(
        and(
          eq(taskRuns.id, input.taskRunId),
          eq(taskRuns.scopeKey, input.scopeKey),
          eq(taskRuns.kind, input.kind),
          eq(taskRuns.status, input.from),
          input.currentDispatchId
            ? eq(taskRuns.dispatchId, input.currentDispatchId)
            : undefined,
        ),
      )
      .for("update");
    if (!task) return false;
    const [dispatch] = await tx
      .insert(taskDispatches)
      .values({
        id: input.dispatchId,
        taskRunId: task.id,
        kind: task.kind,
        scopeKey: task.scopeKey,
        payload: input.payload,
        startAfter:
          typeof input.startAfter === "number"
            ? new Date(Date.now() + input.startAfter * 1000)
            : input.startAfter,
      })
      .onConflictDoNothing()
      .returning();
    if (!dispatch) return false;
    await tx
      .update(taskRuns)
      .set({
        status: "waiting",
        dispatchId: dispatch.id,
        updatedAt: new Date(),
      })
      .where(eq(taskRuns.id, task.id));
    return true;
  });
}
