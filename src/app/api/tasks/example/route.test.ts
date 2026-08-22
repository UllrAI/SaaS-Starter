import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockReadJsonBodyWithLimit = jest.fn();
const mockCreateBackgroundTask = jest.fn();
class MockRequestBodyTooLargeError extends Error {}

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/http/request-body", () => ({
  readJsonBodyWithLimit: mockReadJsonBodyWithLimit,
  RequestBodyTooLargeError: MockRequestBodyTooLargeError,
}));
jest.mock("@/lib/tasks/service", () => ({
  createBackgroundTask: mockCreateBackgroundTask,
}));
jest.mock("@/lib/jobs/server", () => ({ serverJobQueue: {} }));

const taskId = "11111111-1111-4111-8111-111111111111";
const taskRun = {
  id: taskId,
  kind: "example.process",
  status: "queued",
  scopeKey: "user:user-1",
  idempotencyKey: "request-1",
  progress: null,
  input: { message: "hello" },
  result: null,
  error: null,
  providerJobId: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date("2026-08-22T12:00:00.000Z"),
  updatedAt: new Date("2026-08-22T12:00:00.000Z"),
};

function request() {
  return new NextRequest("http://localhost/api/tasks/example", {
    method: "POST",
    body: JSON.stringify({ message: "hello" }),
  });
}

describe("POST /api/tasks/example", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    mockReadJsonBodyWithLimit.mockResolvedValue({
      message: "hello",
      idempotencyKey: "request-1",
    });
    mockCreateBackgroundTask.mockResolvedValue({ taskRun, created: true });
  });

  it("creates and enqueues an owned task", async () => {
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(202);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockCreateBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        scopeKey: "user:user-1",
        payload: { message: "hello" },
        idempotencyKey: "request-1",
      }),
    );
  });

  it("returns the existing task for an idempotent request", async () => {
    mockCreateBackgroundTask.mockResolvedValue({ taskRun, created: false });
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      task: { id: taskId, status: "queued" },
    });
  });

  it("rejects unauthenticated and invalid requests", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValueOnce(null);
    const { POST } = await import("./route");
    expect((await POST(request())).status).toBe(401);

    mockReadJsonBodyWithLimit.mockResolvedValueOnce({ message: "" });
    expect((await POST(request())).status).toBe(400);
    expect(mockCreateBackgroundTask).not.toHaveBeenCalled();
  });

  it("reports an unavailable queue without returning fake success", async () => {
    mockCreateBackgroundTask.mockRejectedValue(new Error("queue unavailable"));
    const { POST } = await import("./route");
    const response = await POST(request());

    expect(response.status).toBe(503);
  });
});
