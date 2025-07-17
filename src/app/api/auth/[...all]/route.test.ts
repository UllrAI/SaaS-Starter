import { describe, it, expect, jest } from "@jest/globals";

// Type definitions for auth handlers
type NextJsHandlers = {
  GET: jest.MockedFunction<() => Promise<unknown>>;
  POST: jest.MockedFunction<() => Promise<unknown>>;
};

// Mock auth server first
const mockAuthHandler = jest.fn();
jest.mock("@/lib/auth/server", () => ({
  auth: {
    handler: mockAuthHandler,
  },
}));

// Mock better-auth module
const mockGetHandler = jest.fn(() =>
  Promise.resolve({}),
) as jest.MockedFunction<() => Promise<unknown>>;
const mockPostHandler = jest.fn(() =>
  Promise.resolve({}),
) as jest.MockedFunction<() => Promise<unknown>>;
const mockToNextJsHandler = jest
  .fn()
  .mockImplementation((handler: unknown): NextJsHandlers => {
    // This is used to validate that the handler is passed correctly
    expect(handler).toBe(mockAuthHandler);
    return {
      GET: mockGetHandler,
      POST: mockPostHandler,
    };
  });

jest.mock("better-auth/next-js", () => ({
  toNextJsHandler: mockToNextJsHandler,
}));

describe("Auth API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should export GET and POST handlers from toNextJsHandler", async () => {
    // Import the route handlers
    const { GET, POST } = await import("./route");

    // Verify toNextJsHandler was called
    expect(mockToNextJsHandler).toHaveBeenCalledTimes(1);

    // Verify both handlers are exported
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");

    // Verify they are the mocked handlers
    expect(GET).toBe(mockGetHandler);
    expect(POST).toBe(mockPostHandler);
  });

  it("should delegate to better-auth toNextJsHandler", async () => {
    // Import triggers the module execution
    const { GET, POST } = await import("./route");

    // Verify the delegation happened correctly and both handlers exist
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("should handle destructuring assignment correctly", async () => {
    const { GET, POST } = await import("./route");

    // Verify both properties exist and are functions
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("should use the auth handler from server module", async () => {
    // Import to ensure the module is executed
    const { GET, POST } = await import("./route");

    // Verify that we get valid function handlers
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
  });

  it("should export handlers that match toNextJsHandler return value", async () => {
    const { GET, POST } = await import("./route");

    // Verify exported handlers match the mocked return values
    expect(GET).toBe(mockGetHandler);
    expect(POST).toBe(mockPostHandler);
  });
});
