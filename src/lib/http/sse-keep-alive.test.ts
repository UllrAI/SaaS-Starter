/** @jest-environment node */

import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withSseKeepAlive } from "./sse-keep-alive";

const decoder = new TextDecoder();

afterEach(() => {
  jest.useRealTimers();
});

describe("withSseKeepAlive", () => {
  it("preserves SSE data and sends comments while the stream is idle", async () => {
    jest.useFakeTimers();
    let sourceController: ReadableStreamDefaultController<Uint8Array>;
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        sourceController = controller;
        controller.enqueue(
          new TextEncoder().encode('data: {"type":"start"}\n\n'),
        );
      },
    });
    const response = withSseKeepAlive(
      new Response(source, {
        status: 202,
        headers: { "content-type": "text/event-stream" },
      }),
      100,
    );
    const reader = response.body?.getReader();

    expect(response.status).toBe(202);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(decoder.decode((await reader?.read())?.value)).toBe(
      'data: {"type":"start"}\n\n',
    );

    jest.advanceTimersByTime(100);
    expect(decoder.decode((await reader?.read())?.value)).toBe(
      ": keep-alive\n\n",
    );

    sourceController!.close();
    expect((await reader?.read())?.done).toBe(true);
  });

  it("leaves non-SSE responses unchanged", () => {
    const response = Response.json({ ok: true });

    expect(withSseKeepAlive(response)).toBe(response);
  });

  it("cancels the source and clears the timer with the client", async () => {
    jest.useFakeTimers();
    const cancel = jest.fn();
    const response = withSseKeepAlive(
      new Response(new ReadableStream({ cancel }), {
        headers: { "content-type": "text/event-stream" },
      }),
      100,
    );

    await response.body?.cancel("client disconnected");

    expect(cancel).toHaveBeenCalledWith("client disconnected");
    expect(jest.getTimerCount()).toBe(0);
  });
});
