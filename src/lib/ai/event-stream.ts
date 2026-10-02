import type { AppDatabase } from "@/database/client";
import { getOwnedAiRun, readAiRunEvents } from "./durable-runs";
import { ACTIVE_AI_RUN_STATUSES } from "./durable-types";

export function createAiRunEventStream(
  db: AppDatabase,
  runId: string,
  userId: string,
  cursor: number,
  signal: AbortSignal,
) {
  const encoder = new TextEncoder();
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let wake: (() => void) | undefined;
  const stop = () => {
    cancelled = true;
    clearTimeout(timer);
    wake?.();
  };
  signal.addEventListener("abort", stop, { once: true });
  let lastKeepAlive = Date.now();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (!cancelled && !signal.aborted) {
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
            signal.removeEventListener("abort", stop);
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
            timer = setTimeout(resolve, 250);
          });
          wake = undefined;
        }
        signal.removeEventListener("abort", stop);
        controller.close();
      } catch (error) {
        signal.removeEventListener("abort", stop);
        if (!cancelled) controller.error(error);
      }
    },
    cancel() {
      stop();
      signal.removeEventListener("abort", stop);
    },
  });
}
