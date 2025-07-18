import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { NextRequest } from "next/server";

// Mock NextResponse
const mockJson = jest.fn() as any;

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: mockJson,
  },
}));

// Mock next/headers with proper return value
const mockHeadersList = {
  get: jest.fn() as any,
};
const mockHeaders = jest.fn() as any;
jest.mock("next/headers", () => ({
  headers: mockHeaders,
}));

// Mock billing
const mockHandleWebhook = jest.fn() as any;
jest.mock("@/lib/billing", () => ({
  billing: {
    handleWebhook: mockHandleWebhook,
  },
}));

describe("Billing Webhooks Creem API", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset headers mock to return the mockHeadersList
    mockHeaders.mockResolvedValue(mockHeadersList);

    mockJson.mockImplementation(
      (data: any, init: { status?: number } = {}) => ({
        json: () => Promise.resolve(data),
        status: init.status || 200,
        ok: (init.status || 200) >= 200 && (init.status || 200) < 300,
      }),
    );
  });

  const createMockRequest = (payload: string): NextRequest => {
    return {
      text: jest.fn().mockResolvedValue(payload) as any,
      headers: {
        get: () => "",
        has: () => false,
        set: () => {},
        entries: () => [],
      },
      cookies: { get: () => null, has: () => false },
      nextUrl: { pathname: "/api/billing/webhooks/creem" },
      url: "http://localhost:3000/api/billing/webhooks/creem",
    } as any as NextRequest;
  };

  describe("POST /api/billing/webhooks/creem", () => {
    it("should return 400 when signature header is missing", async () => {
      mockHeadersList.get.mockReturnValue(null);

      const { POST } = await import("./route");
      const request = createMockRequest('{"event": "test"}');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing webhook signature header");
      expect(mockHeadersList.get).toHaveBeenCalledWith("creem-signature");
    });

    it("should return 400 when signature header is empty string", async () => {
      mockHeadersList.get.mockReturnValue("");

      const { POST } = await import("./route");
      const request = createMockRequest('{"event": "test"}');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing webhook signature header");
    });

    it("should process webhook successfully with valid signature", async () => {
      const mockSignature = "valid-signature-123";
      const mockPayload =
        '{"event": "payment.succeeded", "data": {"id": "pay_123"}}';
      const mockResult = { success: true, processed: true };

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockResolvedValue(mockResult);

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
      );
    });

    it("should handle signature verification errors with 400 status", async () => {
      const mockSignature = "invalid-signature";
      const mockPayload = '{"event": "test"}';

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockRejectedValue(
        new Error("Invalid signature provided"),
      );

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid signature provided");
    });

    it("should handle other webhook errors with 500 status", async () => {
      const mockSignature = "valid-signature";
      const mockPayload = '{"event": "test"}';

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database connection failed");
    });

    it("should handle non-Error exceptions with 500 status", async () => {
      const mockSignature = "valid-signature";
      const mockPayload = '{"event": "test"}';

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockRejectedValue("String error");

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Webhook processing failed");
    });

    it("should handle request.text() failure", async () => {
      mockHeadersList.get.mockReturnValue("valid-signature");

      const request = {
        text: jest
          .fn()
          .mockRejectedValue(new Error("Failed to read request body")) as any,
        headers: {
          get: () => "",
          has: () => false,
          set: () => {},
          entries: () => [],
        },
        cookies: { get: () => null, has: () => false },
        nextUrl: { pathname: "/api/billing/webhooks/creem" },
        url: "http://localhost:3000/api/billing/webhooks/creem",
      } as any as NextRequest;

      const { POST } = await import("./route");

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to read request body");
    });

    it("should handle headers() function failure", async () => {
      // Mock headers to throw an error
      mockHeaders.mockRejectedValue(new Error("Headers not available"));

      const { POST } = await import("./route");
      const request = createMockRequest('{"event": "test"}');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Headers not available");

      // Restore headers mock
      mockHeaders.mockResolvedValue(mockHeadersList);
    });

    it("should pass raw payload string to handleWebhook", async () => {
      const mockSignature = "signature-123";
      const mockPayload = '{"event": "test", "special": "chars \\n\\t"}';
      const mockResult = { processed: true };

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockResolvedValue(mockResult);

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      await POST(request);

      // Verify exact payload was passed
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
      );
    });

    it("should handle empty payload", async () => {
      const mockSignature = "signature-123";
      const mockPayload = "";
      const mockResult = { processed: false };

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockResolvedValue(mockResult);

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(mockHandleWebhook).toHaveBeenCalledWith("", mockSignature);
    });

    it("should handle large payload", async () => {
      const mockSignature = "signature-123";
      const mockPayload = JSON.stringify({
        event: "test",
        data: "x".repeat(10000), // Large payload
      });
      const mockResult = { processed: true };

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockResolvedValue(mockResult);

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(mockHandleWebhook).toHaveBeenCalledWith(
        mockPayload,
        mockSignature,
      );
    });

    it("should detect signature errors case-insensitively", async () => {
      const mockSignature = "invalid-signature";
      const mockPayload = '{"event": "test"}';

      mockHeadersList.get.mockReturnValue(mockSignature);

      // Test uppercase SIGNATURE in error message
      mockHandleWebhook.mockRejectedValue(
        new Error("Invalid SIGNATURE provided"),
      );

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 500 for non-signature related errors", async () => {
      const mockSignature = "valid-signature";
      const mockPayload = '{"event": "test"}';

      mockHeadersList.get.mockReturnValue(mockSignature);
      mockHandleWebhook.mockRejectedValue(new Error("Some other error"));

      const { POST } = await import("./route");
      const request = createMockRequest(mockPayload);

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
