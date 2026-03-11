import { describe, expect, it } from "@jest/globals";

describe("openBrowser", () => {
  it("rejects non-http protocols before launching a browser", async () => {
    const { openBrowser } = await import("./open-browser");

    expect(() => openBrowser("file:///tmp/test")).toThrow(
      "Browser launch only supports http and https URLs.",
    );
  });
});
