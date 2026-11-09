import type { AppDatabase } from "@/database/client";
import { getOwnedAiRun, readAiRunEvents } from "./durable-runs";
import { ACTIVE_AI_RUN_STATUSES } from "./durable-types";
import type { AiStreamLease } from "./stream-leases";

export function createAiRunEventStream(
  db: AppDatabase,
  runId: string,
  userId: string,
  cursor: number,
  signal: AbortSignal,
  lease: AiStreamLease,
) {
  const encoder = new TextEncoder();
  let cancelled = false;
  let released = false;
  let renewedAt = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wake: (() => void) | undefined;
  const cleanup = () => {
    if (released) return;
    released = true;
    clearTimeout(timer);
    wake?.();
    signal.removeEventListener("abort", cleanup);
    void lease.release().catch((error: unknown) => {
      console.error("Could not release AI stream lease:", error);
    });
  };
  signal.addEventListener("abort", cleanup, { once: true });
  if (signal.aborted) cleanup();
  let lastKeepAlive = Date.now();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (!cancelled && !signal.aborted) {
          if (Date.now() - renewedAt >= 15_000) {
            if (!(await lease.renew())) break;
            renewedAt = Date.now();
            if (cancelled || signal.aborted) break;
          }
          const events = await readAiRunEvents(db, runId, cursor);
          if (cancelled || signal.aborted) break;
          for (const event of events) {
            controller.enqueue(
              encoder.encode(
                `id: ${event.sequence}\ndata: ${JSON.stringify(event.chunk)}\n\n`,
              ),
            );
            cursor = event.sequence;
          }
          if (events.length) return;
          const run = await getOwnedAiRun(db, runId, userId);
          if (cancelled || signal.aborted) break;
          // Re-read through lastEventId if completion raced the event query.
          if (
            run &&
            run.lastEventId > cursor &&
            !ACTIVE_AI_RUN_STATUSES.some((status) => status === run.status)
          )
            continue;
          if (
            !run ||
            !ACTIVE_AI_RUN_STATUSES.some((status) => status === run.status)
          ) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            cleanup();
            controller.close();
            return;
          }
          if (Date.now() - lastKeepAlive >= 15_000) {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
            lastKeepAlive = Date.now();
            return;
          }
          await new Promise<void>((resolve) => {
            wake = resolve;
            timer = setTimeout(resolve, 500);
          });
          wake = undefined;
        }
        cleanup();
        if (!cancelled) controller.close();
      } catch (error) {
        cleanup();
        if (cancelled) return;
        if (signal.aborted) controller.close();
        else controller.error(error);
      }
    },
    cancel() {
      cancelled = true;
      cleanup();
    },
  });
}
