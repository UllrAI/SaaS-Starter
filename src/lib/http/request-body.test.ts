import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "./request-body";

function createStreamingRequest(
  chunks: string[],
  headers: HeadersInit = {},
): Request {
  const encoder = new TextEncoder();
  const encodedChunks = chunks.map((chunk) => encoder.encode(chunk));
  let index = 0;
  const body = {
    getReader() {
      return {
        async read() {
          const value = encodedChunks[index];
          index += 1;
          return value ? { done: false, value } : { done: true, value };
        },
        async cancel() {
          index = encodedChunks.length;
        },
      };
    },
  } as ReadableStream<Uint8Array>;

  return {
    body,
    headers: new Headers(headers),
  } as Request;
}

describe("readTextBodyWithLimit", () => {
  it("preserves text split across stream chunks", async () => {
    const request = createStreamingRequest(["hello ", "世界"]);

    await expect(readTextBodyWithLimit(request, 64)).resolves.toBe(
      "hello 世界",
    );
  });

  it("rejects a declared body that exceeds the limit", async () => {
    const request = createStreamingRequest(["small"], {
      "content-length": "128",
    });

    await expect(readTextBodyWithLimit(request, 64)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });

  it("rejects a streamed body that exceeds the limit", async () => {
    const request = createStreamingRequest(["1234", "5678"]);

    await expect(readTextBodyWithLimit(request, 7)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError,
    );
  });
});
