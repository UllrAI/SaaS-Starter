import { createServer, request as forwardRequest } from "node:http";
import { once } from "node:events";

/** Resets an actual HTTP subscription while the independent Worker continues. */
export async function startAiSubscriptionProxy(origin: string) {
  let disconnected = false;
  let restored = false;
  const server = createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
    if (disconnected && !restored) {
      response.writeHead(503);
      response.end("Subscription connection temporarily unavailable.");
      return;
    }
    const upstream = forwardRequest(
      new URL(request.url ?? "/", origin),
      {
        method: "GET",
        headers: { cookie: request.headers.cookie ?? "" },
      },
      (stream) => {
        response.writeHead(stream.statusCode ?? 502, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
        });
        let preview = "";
        stream.on("data", (chunk: Buffer) => {
          response.write(chunk);
          preview = (preview + chunk.toString()).slice(-200);
          if (
            !disconnected &&
            preview.includes("Working on your durable test.")
          ) {
            disconnected = true;
            // Deliver the saved event before simulating a dropped connection.
            const timer = setTimeout(() => response.destroy(), 100);
            response.once("close", () => clearTimeout(timer));
          }
        });
        stream.on("end", () => response.end());
        stream.on("error", () => response.destroy());
      },
    );
    upstream.on("error", () => response.destroy());
    response.once("close", () => upstream.destroy());
    upstream.end();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Subscription proxy did not bind.");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    restore: () => {
      restored = true;
    },
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
