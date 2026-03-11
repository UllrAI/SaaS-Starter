import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockCreateDeviceCode = jest.fn();

jest.mock("@/lib/device-auth/device-service", () => ({
  createDeviceCode: mockCreateDeviceCode,
}));

describe("POST /api/v1/device/code", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a device code for CLI login", async () => {
    mockCreateDeviceCode.mockResolvedValue({
      deviceCode: "0123456789abcdef0123456789abcdef01234567",
      userCode: "ABCD-EFGH",
      verificationUri: "http://localhost:3000/device",
      expiresIn: 900,
      interval: 5,
    });

    const { POST } = await import("./route");
    const response = await POST({
      json: jest.fn().mockResolvedValue({
        clientName: "SaaS CLI",
        clientVersion: "0.1.0",
      }),
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.userCode).toBe("ABCD-EFGH");
  });

  it("rejects invalid request bodies", async () => {
    const { POST } = await import("./route");
    const response = await POST({
      json: jest.fn().mockResolvedValue({
        clientName: "x".repeat(101),
      }),
    } as any);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error.code).toBe("VALIDATION_FAILED");
  });
});
