import { z } from "zod";
import { defineJob } from "./definition";

export const exampleProcessJob = defineJob(
  "example.process",
  z.object({ message: z.string().trim().min(1).max(500) }).strict(),
  async (payload, context) => {
    if (await context.isCancelled()) {
      return null;
    }

    await context.updateProgress({ step: "processing", percent: 50 });

    if (context.signal.aborted || (await context.isCancelled())) {
      return null;
    }

    return {
      message: payload.message,
      processedAt: new Date().toISOString(),
    };
  },
);
