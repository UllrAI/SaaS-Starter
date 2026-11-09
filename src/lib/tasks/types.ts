import type { taskRuns } from "@/database/schema";

export type TaskRun = typeof taskRuns.$inferSelect;
export type TaskRunStatus = TaskRun["status"];

export interface TaskRunError {
  code: string;
  message: string;
  retryable: boolean;
  attempt: number;
}

export function getUserScopeKey(userId: string): string {
  return `user:${userId}`;
}

export function serializeTaskRun(taskRun: TaskRun) {
  return {
    ...taskRun,
    createdAt: taskRun.createdAt.toISOString(),
    updatedAt: taskRun.updatedAt.toISOString(),
    startedAt: taskRun.startedAt?.toISOString() ?? null,
    completedAt: taskRun.completedAt?.toISOString() ?? null,
  };
}
