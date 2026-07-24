jest.mock("@/database", () => ({
  checkDatabaseReadiness: jest.fn(),
}));

import { checkDatabaseReadiness } from "@/database";
import { GET } from "./route";

const mockCheckDatabaseReadiness = jest.mocked(checkDatabaseReadiness);

describe("readiness endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckDatabaseReadiness.mockResolvedValue();
  });

  it("returns ready when the database and user table are available", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ status: "ready" });
    expect(mockCheckDatabaseReadiness).toHaveBeenCalledTimes(1);
  });

  it("returns a controlled 503 when the database check fails", async () => {
    mockCheckDatabaseReadiness.mockRejectedValueOnce(
      new Error("connection refused"),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("5");
    await expect(response.json()).resolves.toEqual({
      status: "unavailable",
    });
  });
});
