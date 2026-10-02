import { describe, expect, it } from "@jest/globals";
const secret = "test-secret-that-is-at-least-32-characters";

describe("response chain handles", () => {
  it("round-trips a response id for the same user", async () => {
    const { createResponseHandle, readResponseHandle } =
      await import("./response-chain");
    const handle = createResponseHandle(
      "resp_123",
      "user-1",
      "conversation-1",
      secret,
    );

    expect(readResponseHandle(handle, "user-1", "conversation-1", secret)).toBe(
      "resp_123",
    );
  });

  it("rejects tampered handles and handles from another user", async () => {
    const { createResponseHandle, readResponseHandle } =
      await import("./response-chain");
    const handle = createResponseHandle(
      "resp_123",
      "user-1",
      "conversation-1",
      secret,
    );

    expect(
      readResponseHandle(`${handle}x`, "user-1", "conversation-1", secret),
    ).toBeNull();
    expect(
      readResponseHandle(handle, "user-2", "conversation-1", secret),
    ).toBeNull();
    expect(
      readResponseHandle(handle, "user-1", "conversation-2", secret),
    ).toBeNull();
    expect(
      readResponseHandle("not-a-handle", "user-1", "conversation-1", secret),
    ).toBeNull();
  });
});
