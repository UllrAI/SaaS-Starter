import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockCancelOwnedBackgroundTask = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/tasks/service", () => ({
  cancelOwnedBackgroundTask: mockCancelOwnedBackgroundTask,
}));
jest.mock("@/lib/jobs/server", () => ({ serverJobQueue: {} }));

const taskId = "11111111-1111-4111-8111-111111111111";
const cancelledTask = {
  id: taskId,
  status: "cancelled",
  createdAt: new Date("2026-08-22T12:00:00.000Z"),
  updatedAt: new Date("2026-08-22T12:01:00.000Z"),
  startedAt: null,
  completedAt: new Date("2026-08-22T12:01:00.000Z"),
};

function request() {
  return new NextRequest(`http://localhost/api/tasks/${taskId}/cancel`, {
    method: "POST",
  });
}

function context(id = taskId) {
  return { params: Promise.resolve({ taskId: id }) };
}

describe("POST /api/tasks/[taskId]/cancel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    mockCancelOwnedBackgroundTask.mockResolvedValue(cancelledTask);
  });

  it("cancels an owned non-terminal task", async () => {
    const { POST } = await import("./route");
    const response = await POST(request(), context());

    expect(response.status).toBe(200);
    expect(mockCancelOwnedBackgroundTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskRunId: taskId,
        scopeKey: "user:user-1",
      }),
    );
  });

  it("does not reveal foreign or malformed tasks", async () => {
    mockCancelOwnedBackgroundTask.mockResolvedValueOnce(null);
    const { POST } = await import("./route");
    expect((await POST(request(), context())).status).toBe(404);
    expect((await POST(request(), context("invalid"))).status).toBe(404);
  });

  it("rejects unauthenticated callers", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);
    const { POST } = await import("./route");
    expect((await POST(request(), context())).status).toBe(401);
    expect(mockCancelOwnedBackgroundTask).not.toHaveBeenCalled();
  });
});
