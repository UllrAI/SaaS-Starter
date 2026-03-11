import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockGetAuthSessionFromHeaders = jest.fn();
const mockAuthorizeDeviceCode = jest.fn();

jest.mock("@/lib/auth/session", () => ({
  getAuthSessionFromHeaders: mockGetAuthSessionFromHeaders,
}));

jest.mock("@/lib/device-auth/device-service", () => ({
  authorizeDeviceCode: mockAuthorizeDeviceCode,
}));

describe("POST /api/v1/device/approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(origin: string | null, body: unknown) {
    return {
      headers: {
        get: (name: string) => {
          if (name === "origin") {
            return origin;
          }

          if (name === "host") {
            return "127.0.0.1:3000";
          }

          return null;
        },
      },
      nextUrl: {
        origin: "http://127.0.0.1:3000",
        protocol: "http:",
      },
      json: jest.fn().mockResolvedValue(body),
    } as any;
  }

  it("rejects invalid origins", async () => {
    const { POST } = await import("./route");
    const response = await POST(createRequest(null, { userCode: "ABCD-EFGH" }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("CSRF_REJECTED");
  });

  it("requires a signed-in user", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      createRequest("http://127.0.0.1:3000", { userCode: "ABCD-EFGH" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHORIZED");
  });

  it("authorizes a device code", async () => {
    mockGetAuthSessionFromHeaders.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    mockAuthorizeDeviceCode.mockResolvedValue({ success: true });

    const { POST } = await import("./route");
    const response = await POST(
      createRequest("http://127.0.0.1:3000", { userCode: "ABCD-EFGH" }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockAuthorizeDeviceCode).toHaveBeenCalledWith("ABCD-EFGH", "user-1");
  });
});
