/** @jest-environment node */

import { createServer } from "node:http";
import { pollDeviceToken } from "./device-login";

it("aborts an in-flight token request when the authorization deadline expires", async () => {
  const controller = new AbortController();
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.write('{"success":');
    controller.abort();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No HTTP port");
    await expect(
      pollDeviceToken(
        `http://127.0.0.1:${address.port}`,
        "fixture",
        0,
        controller.signal,
      ),
    ).rejects.toThrow("Authorization timed out.");
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
