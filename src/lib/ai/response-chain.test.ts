import { describe, expect, it, jest } from "@jest/globals";

jest.mock("server-only", () => ({}));
jest.mock("@/env", () => ({
  __esModule: true,
  default: { BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters" },
}));

describe("response chain handles", () => {
  it("round-trips a response id for the same user", async () => {
    const { createResponseHandle, readResponseHandle } =
      await import("./response-chain");
    const handle = createResponseHandle("resp_123", "user-1", "conversation-1");

    expect(readResponseHandle(handle, "user-1", "conversation-1")).toBe(
      "resp_123",
    );
  });

  it("rejects tampered handles and handles from another user", async () => {
    const { createResponseHandle, readResponseHandle } =
      await import("./response-chain");
    const handle = createResponseHandle("resp_123", "user-1", "conversation-1");

    expect(
      readResponseHandle(`${handle}x`, "user-1", "conversation-1"),
    ).toBeNull();
    expect(readResponseHandle(handle, "user-2", "conversation-1")).toBeNull();
    expect(readResponseHandle(handle, "user-1", "conversation-2")).toBeNull();
    expect(
      readResponseHandle("not-a-handle", "user-1", "conversation-1"),
    ).toBeNull();
  });
});
