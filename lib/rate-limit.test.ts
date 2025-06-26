/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import {
  createRateLimit,
  getClientIP,
  rateLimiters,
  createRateLimitErrorResponse,
  withRateLimit,
} from "./rate-limit";

// Mock NextRequest for testing
function createMockRequest(
  options: {
    xForwardedFor?: string;
    xRealIp?: string;
    pathname?: string;
  } = {},
): NextRequest {
  const headers = new Headers();

  if (options.xForwardedFor) {
    headers.set("x-forwarded-for", options.xForwardedFor);
  }
  if (options.xRealIp) {
    headers.set("x-real-ip", options.xRealIp);
  }

  const url = `https://example.com${options.pathname || "/test"}`;

  const req = new NextRequest(url, { headers });

  return req;
}

describe("Rate Limiting Utility", () => {
  beforeEach(() => {
    // Allow some time between tests to avoid interference
    jest.clearAllTimers();
  });

  afterAll(() => {
    // Clean up any timers to prevent Jest hanging
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe("getClientIP", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const req = createMockRequest({
        xForwardedFor: "192.168.1.1, 10.0.0.1",
      });

      expect(getClientIP(req)).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header when x-forwarded-for not present", () => {
      const req = createMockRequest({
        xRealIp: "192.168.1.2",
      });

      expect(getClientIP(req)).toBe("192.168.1.2");
    });

    it('should return "unknown" when headers not present', () => {
      const req = createMockRequest({});

      expect(getClientIP(req)).toBe("unknown");
    });

    it('should return "unknown" when no IP available', () => {
      // Create request without IP property being mocked
      const headers = new Headers();
      const url = "https://example.com/test";
      const req = new NextRequest(url, { headers });

      expect(getClientIP(req)).toBe("unknown");
    });
  });

  describe("createRateLimit", () => {
    it("should allow requests within limit", async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const req = createMockRequest();
      const result = await rateLimit(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.used).toBe(1);
      expect(result.remaining).toBe(4);
      expect(result.headers["X-RateLimit-Limit"]).toBe("5");
      expect(result.headers["X-RateLimit-Remaining"]).toBe("4");
    });

    it("should block requests when limit exceeded", async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 2,
      });

      const req = createMockRequest({ xForwardedFor: "192.168.1.10" });

      // First two requests should succeed
      let result = await rateLimit(req);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);

      result = await rateLimit(req);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);

      // Third request should be blocked
      result = await rateLimit(req);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset counter after window expires", async () => {
      const rateLimit = createRateLimit({
        windowMs: 100, // Very short window for testing
        maxRequests: 1,
      });

      const req = createMockRequest({ xForwardedFor: "192.168.1.11" });

      // First request should succeed
      let result = await rateLimit(req);
      expect(result.success).toBe(true);

      // Second request should be blocked
      result = await rateLimit(req);
      expect(result.success).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Third request should succeed (window reset)
      result = await rateLimit(req);
      expect(result.success).toBe(true);
      expect(result.used).toBe(1);
    });

    it("should use custom key generator", async () => {
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        keyGenerator: (req) => `custom-${req.nextUrl.pathname}`,
      });

      const req1 = createMockRequest({ pathname: "/path1" });
      const req2 = createMockRequest({ pathname: "/path2" });

      // Different paths should have separate limits
      let result1 = await rateLimit(req1);
      expect(result1.success).toBe(true);

      const result2 = await rateLimit(req2);
      expect(result2.success).toBe(true);

      // Same path should be limited
      result1 = await rateLimit(req1);
      expect(result1.success).toBe(false);
    });
  });

  describe("predefined rate limiters", () => {
    it("should have auth rate limiter with correct config", async () => {
      const req = createMockRequest({ xForwardedFor: "192.168.1.20" });
      const result = await rateLimiters.auth(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(50);
    });

    it("should have upload rate limiter with correct config", async () => {
      const req = createMockRequest({ xForwardedFor: "192.168.1.21" });
      const result = await rateLimiters.upload(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
    });

    it("should have fileUpload rate limiter with stricter limits", async () => {
      const req = createMockRequest({ xForwardedFor: "192.168.1.22" });
      const result = await rateLimiters.fileUpload(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(100);
    });

    it("should have billing rate limiter with strict limits", async () => {
      const req = createMockRequest({ xForwardedFor: "192.168.1.23" });
      const result = await rateLimiters.billing(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
    });

    it("should have paymentStatus rate limiter with lenient limits", async () => {
      const req = createMockRequest({ xForwardedFor: "192.168.1.24" });
      const result = await rateLimiters.paymentStatus(req);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(20);
    });
  });

  describe("createRateLimitErrorResponse", () => {
    it("should create proper error response", () => {
      const result = {
        limit: 5,
        used: 5,
        remaining: 0,
        resetTime: Date.now() + 60000,
      };

      const response = createRateLimitErrorResponse(result);

      expect(response.status).toBe(429);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });

    it("should include proper error message in response body", async () => {
      const result = {
        limit: 5,
        used: 5,
        remaining: 0,
        resetTime: Date.now() + 60000,
      };

      const response = createRateLimitErrorResponse(result);
      const body = await response.json();

      expect(body.error).toBe("Rate limit exceeded");
      expect(body.message).toBe("Too many requests, please try again later.");
      expect(body.retryAfter).toBeGreaterThan(0);
    });
  });

  describe("withRateLimit", () => {
    it("should call handler when rate limit not exceeded", async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response("OK"));
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);
      const req = createMockRequest({ xForwardedFor: "192.168.1.30" });

      const response = await wrappedHandler(req);

      expect(mockHandler).toHaveBeenCalledWith(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    });

    it("should return 429 when rate limit exceeded", async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response("OK"));
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 1,
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);
      const req = createMockRequest({ xForwardedFor: "192.168.1.31" });

      // First call should succeed
      let response = await wrappedHandler(req);
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Second call should be rate limited
      response = await wrappedHandler(req);
      expect(response.status).toBe(429);
      expect(mockHandler).toHaveBeenCalledTimes(1); // Handler not called again
    });

    it("should pass additional arguments to handler", async () => {
      const mockHandler = jest.fn().mockResolvedValue(new Response("OK"));
      const rateLimit = createRateLimit({
        windowMs: 60000,
        maxRequests: 5,
      });

      const wrappedHandler = withRateLimit(mockHandler, rateLimit);
      const req = createMockRequest({ xForwardedFor: "192.168.1.32" });
      const additionalArg = { test: "value" };

      await wrappedHandler(req, additionalArg);

      expect(mockHandler).toHaveBeenCalledWith(req, additionalArg);
    });
  });

  describe("rate limiter isolation", () => {
    it("should isolate different rate limiters", async () => {
      const req1 = createMockRequest({ xForwardedFor: "192.168.1.40" });
      const req2 = createMockRequest({ xForwardedFor: "192.168.1.40" }); // Same IP

      // Use different rate limiters for same IP
      const authResult = await rateLimiters.auth(req1);
      const uploadResult = await rateLimiters.upload(req2);

      expect(authResult.success).toBe(true);
      expect(uploadResult.success).toBe(true);

      // They should have different counters
      expect(authResult.used).toBe(1);
      expect(uploadResult.used).toBe(1);
    });
  });
});
