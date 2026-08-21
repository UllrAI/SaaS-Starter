const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 10_000;
const KEEP_ALIVE_COMMENT = new TextEncoder().encode(": keep-alive\n\n");

export function withSseKeepAlive(
  response: Response,
  intervalMs = DEFAULT_KEEP_ALIVE_INTERVAL_MS,
) {
  if (
    !response.body ||
    !response.headers.get("content-type")?.startsWith("text/event-stream")
  ) {
    return response;
  }

  const reader = response.body.getReader();
  let timer: ReturnType<typeof setInterval> | undefined;
  let finished = false;

  const clearTimer = () => {
    finished = true;
    if (timer !== undefined) clearInterval(timer);
  };

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      timer = setInterval(() => {
        if (!finished) controller.enqueue(KEEP_ALIVE_COMMENT);
      }, intervalMs);

      void (async () => {
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) {
              if (finished) return;
              clearTimer();
              controller.close();
              return;
            }
            if (!finished) controller.enqueue(chunk.value);
          }
        } catch (error) {
          if (finished) return;
          clearTimer();
          controller.error(error);
        }
      })();
    },
    async cancel(reason) {
      clearTimer();
      await reader.cancel(reason);
    },
  });

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
