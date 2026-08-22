import { describe, expect, it } from "@jest/globals";
import type { AppDatabase } from "@/database/client";
import { transitionTaskRun } from "./repository";

describe("task transition policy", () => {
  const unusedDatabase = {} as AppDatabase;

  it("rejects terminal-state rewrites before accessing storage", async () => {
    await expect(
      transitionTaskRun(unusedDatabase, {
        taskRunId: "11111111-1111-4111-8111-111111111111",
        from: ["completed"],
        to: "running",
      }),
    ).rejects.toThrow("Invalid task transition from completed to running");
  });

  it("rejects mixed source sets containing an illegal transition", async () => {
    await expect(
      transitionTaskRun(unusedDatabase, {
        taskRunId: "11111111-1111-4111-8111-111111111111",
        from: ["queued", "running"],
        to: "completed",
      }),
    ).rejects.toThrow(
      "Invalid task transition from queued/running to completed",
    );
  });
});
