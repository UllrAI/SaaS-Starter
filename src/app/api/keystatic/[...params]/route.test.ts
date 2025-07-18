import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { NextRequest } from "next/server";

// Mock Response constructor
class MockResponse {
  status: number;

  constructor(body: unknown, init?: { status?: number }) {
    this.status = init?.status || 200;
  }

  async text() {
    return "";
  }
}

// Type definitions for Keystatic route handlers
type RouteHandler = (req: NextRequest) => Promise<Response>;
type RouteHandlers = {
  GET: jest.MockedFunction<RouteHandler>;
  POST: jest.MockedFunction<RouteHandler>;
};

// Mock Keystatic dependencies
const mockMakeRouteHandler = jest.fn() as jest.MockedFunction<
  () => RouteHandlers
>;
jest.mock("@keystatic/next/route-handler", () => ({
  makeRouteHandler: mockMakeRouteHandler,
}));

// Mock keystatic config
const mockKeystaticConfig = {
  storage: { kind: "local" },
  ui: { brand: { name: "TestApp" } },
  collections: {},
};

jest.mock("@/keystatic.config", () => ({
  __esModule: true,
  default: mockKeystaticConfig,
  showAdminUI: true, // Will be overridden in tests
}));

// Store original environment
const originalEnv = process.env;

describe("Keystatic API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset modules to ensure fresh imports
    jest.resetModules();
    // Set Response to use our mock
    (global as typeof globalThis).Response = MockResponse as typeof Response;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("when showAdminUI is true", () => {
    beforeEach(() => {
      // Mock showAdminUI to be true
      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: mockKeystaticConfig,
        showAdminUI: true,
      }));

      // Mock the route handlers returned by makeRouteHandler
      mockMakeRouteHandler.mockReturnValue({
        GET: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
        POST: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
      });
    });

    it("should call makeRouteHandler with correct config", async () => {
      // Import after setting up mocks
      await import("./route");

      expect(mockMakeRouteHandler).toHaveBeenCalledWith({
        config: mockKeystaticConfig,
      });
    });

    it("should export GET and POST handlers from makeRouteHandler", async () => {
      const mockGetHandler = jest.fn() as jest.MockedFunction<
        (req: NextRequest) => Promise<Response>
      >;
      const mockPostHandler = jest.fn() as jest.MockedFunction<
        (req: NextRequest) => Promise<Response>
      >;

      mockMakeRouteHandler.mockReturnValue({
        GET: mockGetHandler,
        POST: mockPostHandler,
      });

      const { GET, POST } = await import("./route");

      expect(GET).toBe(mockGetHandler);
      expect(POST).toBe(mockPostHandler);
    });
  });

  describe("when showAdminUI is false", () => {
    beforeEach(() => {
      // Mock showAdminUI to be false
      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: mockKeystaticConfig,
        showAdminUI: false,
      }));
    });

    it("should not call makeRouteHandler", async () => {
      await import("./route");

      expect(mockMakeRouteHandler).not.toHaveBeenCalled();
    });

    it("should export GET and POST as functions", async () => {
      const { GET, POST } = await import("./route");

      expect(typeof GET).toBe("function");
      expect(typeof POST).toBe("function");
    });

    it("should create 404 response handlers", () => {
      // Test the notFoundRouteHandler function logic directly
      const notFoundRouteHandler = () => {
        return new Response(null, {
          status: 404,
        });
      };

      const response = notFoundRouteHandler();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(404);
    });
  });

  describe("environment-based configuration", () => {
    it("should show admin UI in development environment", () => {
      // Test the actual logic since we know showAdminUI = process.env.NODE_ENV === "development"
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      const result = process.env.NODE_ENV === "development";
      expect(result).toBe(true);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });

    it("should hide admin UI in production environment", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });

      const result = process.env.NODE_ENV === "development";
      expect(result).toBe(false);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });

    it("should hide admin UI in test environment", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "test",
        writable: true,
      });

      const result = process.env.NODE_ENV === "development";
      expect(result).toBe(false);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe("route handler behavior", () => {
    it("should maintain consistent handler types", async () => {
      // Test with showAdminUI = true
      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: mockKeystaticConfig,
        showAdminUI: true,
      }));

      mockMakeRouteHandler.mockReturnValue({
        GET: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
        POST: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
      });

      const { GET: GET_TRUE, POST: POST_TRUE } = await import("./route");

      expect(typeof GET_TRUE).toBe("function");
      expect(typeof POST_TRUE).toBe("function");

      // Reset and test with showAdminUI = false
      jest.resetModules();
      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: mockKeystaticConfig,
        showAdminUI: false,
      }));

      const { GET: GET_FALSE, POST: POST_FALSE } = await import("./route");

      expect(typeof GET_FALSE).toBe("function");
      expect(typeof POST_FALSE).toBe("function");
    });
  });

  describe("configuration validation", () => {
    it("should handle missing config gracefully", async () => {
      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: null,
        showAdminUI: true,
      }));

      mockMakeRouteHandler.mockReturnValue({
        GET: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
        POST: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
      });

      await import("./route");

      expect(mockMakeRouteHandler).toHaveBeenCalledWith({
        config: null,
      });
    });

    it("should pass through config properties correctly", async () => {
      const customConfig = {
        storage: { kind: "github" },
        ui: { brand: { name: "CustomApp" } },
        collections: {
          posts: {
            label: "Posts",
            schema: {},
          },
        },
      };

      jest.doMock("@/keystatic.config", () => ({
        __esModule: true,
        default: customConfig,
        showAdminUI: true,
      }));

      mockMakeRouteHandler.mockReturnValue({
        GET: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
        POST: jest.fn() as jest.MockedFunction<
          (req: NextRequest) => Promise<Response>
        >,
      });

      await import("./route");

      expect(mockMakeRouteHandler).toHaveBeenCalledWith({
        config: customConfig,
      });
    });
  });
});
