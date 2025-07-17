import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_APP_URL: "https://example.com",
};

// Setup mocks before imports
jest.mock("@/env", () => mockEnv);

describe("CORS Test Route", () => {
  // Store original Date to restore later
  const originalDate = global.Date;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock environment to default values
    mockEnv.NEXT_PUBLIC_APP_URL = "https://example.com";
  });

  afterEach(() => {
    jest.resetAllMocks();
    global.Date = originalDate;
  });

  describe("GET endpoint", () => {
    it("should return successful CORS test response with origin", async () => {
      // Mock Date for predictable timestamp
      const mockDate = new Date("2023-12-01T10:00:00.000Z");
      global.Date = jest.fn(() => mockDate) as any;
      global.Date.prototype = originalDate.prototype;

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue("https://client.example.com"),
        },
      } as any;

      // Import after mocks are set up
      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      expect(mockRequest.headers.get).toHaveBeenCalledWith("origin");
      
      // Convert response to JSON to verify
      const responseJson = await result.json();
      
      expect(responseJson).toEqual({
        message: "CORS test successful",
        timestamp: "2023-12-01T10:00:00.000Z",
        origin: "https://client.example.com",
      });
      
      expect(result.status).toBe(200);
      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      expect(result.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
      expect(result.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    });

    it("should handle request with no origin header", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();
      
      expect(responseJson.origin).toBe("unknown");
      expect(responseJson.message).toBe("CORS test successful");
      expect(typeof responseJson.timestamp).toBe("string");
    });

    it("should handle request with empty origin header", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(""),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();
      
      expect(responseJson.origin).toBe("unknown");
    });

    it("should include correct CORS headers", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      expect(result.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
      expect(result.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
    });

    it("should return 200 status code", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      expect(result.status).toBe(200);
    });

    it("should include valid ISO timestamp", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();
      const timestamp = responseJson.timestamp;
      
      // Check if it's a valid ISO 8601 string
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Check if it can be parsed as a valid date
      const parsedDate = new Date(timestamp);
      expect(parsedDate.toISOString()).toBe(timestamp);
    });

    it("should handle different origin values", async () => {
      const origins = [
        "https://app.example.com",
        "http://localhost:3000",
        "https://subdomain.example.org",
        "https://different-domain.com",
        null,
        "",
        "invalid-origin",
      ];

      for (const origin of origins) {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(origin),
          },
        } as any;

        const { GET } = await import("./route");
        const result = await GET(mockRequest);

        const responseJson = await result.json();
        expect(responseJson.origin).toBe(origin || "unknown");
      }
    });

    it("should use environment variable for Access-Control-Allow-Origin", async () => {
      const customAppUrl = "https://custom-app.example.com";
      mockEnv.NEXT_PUBLIC_APP_URL = customAppUrl;

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      // Reset modules to pick up new environment variable
      jest.resetModules();
      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(customAppUrl);
    });
  });

  describe("OPTIONS endpoint", () => {
    it("should return correct preflight response", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      expect(result.status).toBe(200);
      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      expect(result.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
      expect(result.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
      expect(result.headers.get("Access-Control-Max-Age")).toBe("86400");
    });

    it("should return 200 status code", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      expect(result.status).toBe(200);
    });

    it("should include all required CORS headers", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      expect(result.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS");
      expect(result.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
      expect(result.headers.get("Access-Control-Max-Age")).toBe("86400");
    });

    it("should return null body for preflight request", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      // The response should have no body
      const text = await result.text();
      expect(text).toBe("");
    });

    it("should include Access-Control-Max-Age header", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      expect(result.headers.get("Access-Control-Max-Age")).toBe("86400");
    });

    it("should use environment variable for Access-Control-Allow-Origin", async () => {
      const customAppUrl = "https://custom-preflight.example.com";
      mockEnv.NEXT_PUBLIC_APP_URL = customAppUrl;

      jest.resetModules();
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(customAppUrl);
    });
  });

  describe("CORS Configuration", () => {
    it("should have consistent CORS headers between GET and OPTIONS", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET, OPTIONS } = await import("./route");
      const getResult = await GET(mockRequest);
      const optionsResult = await OPTIONS();

      // Check that common CORS headers are consistent
      expect(getResult.headers.get("Access-Control-Allow-Origin")).toBe(
        optionsResult.headers.get("Access-Control-Allow-Origin")
      );
      expect(getResult.headers.get("Access-Control-Allow-Methods")).toBe(
        optionsResult.headers.get("Access-Control-Allow-Methods")
      );
      expect(getResult.headers.get("Access-Control-Allow-Headers")).toBe(
        optionsResult.headers.get("Access-Control-Allow-Headers")
      );
    });

    it("should include all standard HTTP methods in Allow-Methods", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      const allowMethods = result.headers.get("Access-Control-Allow-Methods");

      expect(allowMethods).toContain("GET");
      expect(allowMethods).toContain("POST");
      expect(allowMethods).toContain("PUT");
      expect(allowMethods).toContain("DELETE");
      expect(allowMethods).toContain("OPTIONS");
    });

    it("should include standard headers in Allow-Headers", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      const allowHeaders = result.headers.get("Access-Control-Allow-Headers");

      expect(allowHeaders).toContain("Content-Type");
      expect(allowHeaders).toContain("Authorization");
    });

    it("should set reasonable cache duration for preflight", async () => {
      const { OPTIONS } = await import("./route");
      const result = await OPTIONS();

      const maxAge = result.headers.get("Access-Control-Max-Age");

      expect(maxAge).toBe("86400"); // 24 hours in seconds
      expect(parseInt(maxAge!)).toBe(24 * 60 * 60);
    });
  });

  describe("Environment Variable Handling", () => {
    it("should handle undefined NEXT_PUBLIC_APP_URL", async () => {
      delete (mockEnv as any).NEXT_PUBLIC_APP_URL;

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      jest.resetModules();
      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should handle empty NEXT_PUBLIC_APP_URL", async () => {
      mockEnv.NEXT_PUBLIC_APP_URL = "";

      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      jest.resetModules();
      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      // When NEXT_PUBLIC_APP_URL is empty string, NextResponse headers.get() returns null
      expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should handle different APP_URL formats", async () => {
      const urlFormats = [
        "https://example.com",
        "http://localhost:3000",
        "https://app.staging.example.com",
        "https://subdomain.example.org:8080",
        "*", // wildcard
        "null",
      ];

      for (const url of urlFormats) {
        mockEnv.NEXT_PUBLIC_APP_URL = url;

        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(null),
          },
        } as any;

        jest.resetModules();
        const { GET, OPTIONS } = await import("./route");
        const getResult = await GET(mockRequest);
        const optionsResult = await OPTIONS();

        // Check GET response
        expect(getResult.headers.get("Access-Control-Allow-Origin")).toBe(url);

        // Check OPTIONS response
        expect(optionsResult.headers.get("Access-Control-Allow-Origin")).toBe(url);
      }
    });
  });

  describe("Request Header Parsing", () => {
    it("should correctly parse origin from request headers", async () => {
      const testOrigins = [
        "https://test1.example.com",
        "http://localhost:3000",
        "https://app.production.com",
      ];

      for (const origin of testOrigins) {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(origin),
          },
        } as any;

        const { GET } = await import("./route");
        const result = await GET(mockRequest);

        expect(mockRequest.headers.get).toHaveBeenCalledWith("origin");
        
        const responseJson = await result.json();
        expect(responseJson.origin).toBe(origin);
      }
    });

    it("should handle malformed origin headers gracefully", async () => {
      const malformedOrigins = [
        "not-a-url",
        "://invalid",
        "http://",
        "https://",
        "ftp://example.com",
        " https://example.com ",
        "https://example.com/path",
      ];

      for (const origin of malformedOrigins) {
        const mockRequest = {
          headers: {
            get: jest.fn().mockReturnValue(origin),
          },
        } as any;

        const { GET } = await import("./route");
        const result = await GET(mockRequest);

        const responseJson = await result.json();
        expect(responseJson.origin).toBe(origin);
      }
    });
  });

  describe("Response Format", () => {
    it("should return JSON response with correct structure", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue("https://test.com"),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();

      expect(responseJson).toHaveProperty("message");
      expect(responseJson).toHaveProperty("timestamp");
      expect(responseJson).toHaveProperty("origin");

      expect(typeof responseJson.message).toBe("string");
      expect(typeof responseJson.timestamp).toBe("string");
      expect(typeof responseJson.origin).toBe("string");
    });

    it("should have consistent success message", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();
      expect(responseJson.message).toBe("CORS test successful");
    });

    it("should generate valid ISO 8601 timestamp", async () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as any;

      const { GET } = await import("./route");
      const result = await GET(mockRequest);

      const responseJson = await result.json();
      const timestamp = responseJson.timestamp;

      // Check if it's a valid ISO 8601 string
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Check if it can be parsed as a valid date
      const parsedDate = new Date(timestamp);
      expect(parsedDate.toISOString()).toBe(timestamp);
    });
  });

  describe("Integration Tests", () => {
    it("should handle a complete CORS preflight flow", async () => {
      const { GET, OPTIONS } = await import("./route");
      
      // Simulate preflight OPTIONS request
      const optionsResult = await OPTIONS();

      // Simulate actual GET request
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue("https://client.example.com"),
        },
      } as any;

      const getResult = await GET(mockRequest);

      // Verify OPTIONS response
      expect(optionsResult.status).toBe(200);
      expect(optionsResult.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      expect(optionsResult.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(optionsResult.headers.get("Access-Control-Max-Age")).toBe("86400");

      // Verify GET response
      expect(getResult.status).toBe(200);
      expect(getResult.headers.get("Access-Control-Allow-Origin")).toBe(mockEnv.NEXT_PUBLIC_APP_URL);
      
      const responseJson = await getResult.json();
      expect(responseJson.message).toBe("CORS test successful");
      expect(responseJson.origin).toBe("https://client.example.com");
    });

    it("should work with real-world browser scenario", async () => {
      // Simulate browser preflight request for a cross-origin request
      const { OPTIONS } = await import("./route");
      const preflightResult = await OPTIONS();

      // Verify preflight allows the actual request
      expect(preflightResult.status).toBe(200);
      expect(preflightResult.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(preflightResult.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");

      // Simulate the actual request from the browser
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue("https://frontend.app.com"),
        },
      } as any;

      const { GET } = await import("./route");
      const actualResult = await GET(mockRequest);

      // Verify the actual request succeeds
      expect(actualResult.status).toBe(200);
      const responseJson = await actualResult.json();
      expect(responseJson.message).toBe("CORS test successful");
      expect(responseJson.origin).toBe("https://frontend.app.com");
    });
  });
});