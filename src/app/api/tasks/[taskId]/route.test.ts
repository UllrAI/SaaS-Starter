import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NextRequest } from "next/server";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockGetOwnedTaskRun = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));
jest.mock("@/lib/tasks/repository", () => ({
  getOwnedTaskRun: mockGetOwnedTaskRun,
}));

const taskId = "11111111-1111-4111-8111-111111111111";
const taskRun = {
  id: taskId,
  status: "completed",
  createdAt: new Date("2026-08-22T12:00:00.000Z"),
  updatedAt: new Date("2026-08-22T12:01:00.000Z"),
  startedAt: new Date("2026-08-22T12:00:01.000Z"),
  completedAt: new Date("2026-08-22T12:01:00.000Z"),
};

function request() {
  return new NextRequest(`http://localhost/api/tasks/${taskId}`);
}

function context(id = taskId) {
  return { params: Promise.resolve({ taskId: id }) };
}

describe("GET /api/tasks/[taskId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthSessionFromHeaders.mockResolvedValue({ user: { id: "user-1" } });
    mockGetOwnedTaskRun.mockResolvedValue(taskRun);
  });

  it("returns only a task owned by the current user scope", async () => {
    const { GET } = await import("./route");
    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(mockGetOwnedTaskRun).toHaveBeenCalledWith(
      expect.anything(),
      taskId,
      "user:user-1",
    );
    await expect(response.json()).resolves.toMatchObject({
      task: { id: taskId, status: "completed" },
    });
  });

  it("does not reveal missing, foreign, or malformed tasks", async () => {
    mockGetOwnedTaskRun.mockResolvedValueOnce(null);
    const { GET } = await import("./route");
    expect((await GET(request(), context())).status).toBe(404);
    expect((await GET(request(), context("invalid"))).status).toBe(404);
  });

  it("rejects unauthenticated callers before storage access", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);
    const { GET } = await import("./route");
    expect((await GET(request(), context())).status).toBe(401);
    expect(mockGetOwnedTaskRun).not.toHaveBeenCalled();
  });
});
