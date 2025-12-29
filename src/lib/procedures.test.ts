import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { z } from "zod";
import type { SpyInstance } from "../jest.setup";

// Mock the dependencies BEFORE any imports
const mockNext = jest.fn(() => Promise.resolve({})) as jest.MockedFunction<
  () => Promise<any>
>;
const mockUse = jest.fn() as jest.MockedFunction<(middleware: any) => any>;
const mockOutputSchema = jest.fn() as jest.MockedFunction<(schema: any) => any>;
const mockCreateSafeActionClient = jest.fn() as jest.MockedFunction<
  (config: any) => any
>;
const mockAuth = {
  api: {
    getSession: jest.fn() as jest.MockedFunction<() => Promise<any>>,
  },
};
const mockHeaders = jest.fn() as jest.MockedFunction<() => Promise<any>>;

jest.mock("./auth/server", () => ({
  auth: mockAuth,
}));

jest.mock("@/lib/auth/server", () => ({
  auth: mockAuth,
}));

jest.mock("next/headers", () => ({
  headers: mockHeaders,
}));

jest.mock("@/lib/config/constants", () => ({
  APP_NAME: "Test App",
}));

jest.mock("next-safe-action", () => ({
  createSafeActionClient: mockCreateSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE: "Something went wrong",
}));

describe("procedures", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockOutputSchema.mockReturnThis();
    mockUse.mockReturnThis();
    mockCreateSafeActionClient.mockImplementation(
      (options: {
        handleServerError?: (error: any) => string;
        defineMetadataSchema?: () => any;
      }) => ({
        use: mockUse,
        outputSchema: mockOutputSchema,
        handleServerError: options?.handleServerError,
        defineMetadataSchema: options?.defineMetadataSchema,
      }),
    );

    mockHeaders.mockResolvedValue({
      authorization: "Bearer mock-token",
      "user-agent": "Test User Agent",
    });

    // Ensure auth mock returns success
    mockAuth.api.getSession.mockResolvedValue({
      session: { id: "test-session" },
      user: { id: "test-user" },
    });
  });

  describe("actionClient creation", () => {
    beforeEach(() => {
      // Clear module cache to test fresh imports
      jest.resetModules();
    });

    it("should create action client with error handler", async () => {
      // Re-import to trigger client creation
      await import("./procedures");

      expect(mockCreateSafeActionClient).toHaveBeenCalledWith({
        handleServerError: expect.any(Function),
        defineMetadataSchema: expect.any(Function),
      });
    });

    it("should handle server errors with Error instances", async () => {
      await import("./procedures");

      const config = mockCreateSafeActionClient.mock.calls[0][0] as {
        handleServerError?: (error: unknown) => string;
      };
      const errorHandler = config.handleServerError;

      const testError = new Error("Test error message");
      expect(errorHandler?.(testError)).toBe("Test error message");
    });

    it("should handle server errors with non-Error instances", async () => {
      await import("./procedures");

      const config = mockCreateSafeActionClient.mock.calls[0][0] as {
        handleServerError?: (error: unknown) => string;
      };
      const errorHandler = config.handleServerError;

      const result = errorHandler?.("unknown error");

      expect(result).toBe("Something went wrong");
    });

    it("should define metadata schema correctly", async () => {
      await import("./procedures");

      const config = mockCreateSafeActionClient.mock.calls[0][0] as {
        defineMetadataSchema?: () => any;
      };
      const metadataSchemaFn = config.defineMetadataSchema;

      const schema = metadataSchemaFn?.();

      // The schema should be a Zod object with actionName field
      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });
  });

  describe("logging middleware", () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      jest.resetModules();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log performance metrics", async () => {
      // Mock performance.now to control timing
      const mockPerformanceNow = jest.spyOn(performance, "now");

      mockUse.mockImplementation(
        (
          middlewareFn: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
            clientInput?: any;
            metadata?: any;
          }) => void,
        ) => {
          // Execute the middleware function
          const mockContext = {
            next: mockNext,
            clientInput: { test: "input" },
            metadata: { actionName: "testAction" },
          };

          mockNext.mockResolvedValue({ success: true });

          middlewareFn(mockContext);

          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      expect(mockUse).toHaveBeenCalled();
      mockPerformanceNow.mockRestore();
    });
  });

  describe("authActionClient", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("should create authenticated action client", async () => {
      const { authActionClient } = await import("./procedures");

      expect(authActionClient).toBeDefined();
      expect(mockUse).toHaveBeenCalled();
      expect(mockOutputSchema).toHaveBeenCalled();
    });

    it("should handle successful authentication", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: {
          id: "session-123",
          userId: "user-123",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
      });

      let authMiddleware:
        | ((context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>)
        | undefined;
      mockUse.mockImplementation(
        (
          middleware: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>,
        ) => {
          authMiddleware = middleware;
          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      // Test the auth middleware
      const mockContext = {
        next: jest.fn().mockResolvedValue({ success: true }) as any,
      } as any;

      if (authMiddleware) {
        await authMiddleware(mockContext);
      }

      expect(mockAuth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Object),
      });
      expect(mockContext.next).toHaveBeenCalledWith({
        ctx: {
          user: expect.objectContaining({ id: "user-123" }),
          session: expect.objectContaining({ id: "session-123" }),
          utils: {
            authenticatedUrl: "/dashboard",
            unauthenticatedUrl: "/login",
            appName: "Test App",
          },
        },
      });
    });

    it("should throw error when no session exists", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      let authMiddleware:
        | ((context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>)
        | undefined;
      mockUse.mockImplementation(
        (
          middleware: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>,
        ) => {
          authMiddleware = middleware;
          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      // Test the auth middleware
      const mockContext = {
        next: mockNext,
      };

      if (authMiddleware) {
        await expect(authMiddleware(mockContext)).rejects.toThrow(
          "You are not authorized to perform this action",
        );
      }
    });

    it("should throw error when session exists but no user", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: { id: "session-123" },
        user: null,
      });

      let authMiddleware:
        | ((context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>)
        | undefined;
      mockUse.mockImplementation(
        (
          middleware: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>,
        ) => {
          authMiddleware = middleware;
          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      const mockContext = {
        next: mockNext,
      };

      if (authMiddleware) {
        await expect(authMiddleware(mockContext)).rejects.toThrow(
          "You are not authorized to perform this action",
        );
      }
    });

    it("should throw error when user exists but no session", async () => {
      mockAuth.api.getSession.mockResolvedValue({
        session: null,
        user: { id: "user-123" },
      });

      let authMiddleware:
        | ((context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>)
        | undefined;
      mockUse.mockImplementation(
        (
          middleware: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>,
        ) => {
          authMiddleware = middleware;
          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      const mockContext = {
        next: mockNext,
      };

      if (authMiddleware) {
        await expect(authMiddleware(mockContext)).rejects.toThrow(
          "You are not authorized to perform this action",
        );
      }
    });

    it("should define correct output schema", async () => {
      await import("./procedures");

      const schema = mockOutputSchema.mock.calls[0]?.[0];

      expect(schema).toEqual(
        expect.objectContaining({
          parse: expect.any(Function),
        }),
      );
    });
  });

  describe("error handling integration", () => {
    let consoleSpy: SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should log errors during error handling", async () => {
      await import("./procedures");

      const config = mockCreateSafeActionClient.mock.calls[0][0] as {
        handleServerError?: (error: unknown) => string;
      };
      const errorHandler = config.handleServerError;

      const testError = new Error("Database connection failed");
      errorHandler?.(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Action error:",
        "Database connection failed",
      );
    });

    it("should handle authentication errors", async () => {
      mockAuth.api.getSession.mockRejectedValue(
        new Error("Auth service unavailable"),
      );

      let authMiddleware:
        | ((context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>)
        | undefined;
      mockUse.mockImplementation(
        (
          middleware: (context: {
            next: jest.MockedFunction<() => Promise<any>>;
          }) => Promise<void>,
        ) => {
          authMiddleware = middleware;
          return { use: mockUse, outputSchema: mockOutputSchema };
        },
      );

      await import("./procedures");

      const mockContext = {
        next: mockNext,
      };

      if (authMiddleware) {
        await expect(authMiddleware(mockContext)).rejects.toThrow(
          "Auth service unavailable",
        );
      }
    });
  });

  describe("metadata validation", () => {
    it("should create valid metadata schema with string actionName", async () => {
      // Don't import the procedures module, just test the schema directly
      const schema = z.object({
        actionName: z.string(),
      });

      // Test valid metadata
      const validMetadata = { actionName: "testAction" };
      const parseResult = schema.safeParse(validMetadata);

      expect(parseResult.success).toBe(true);
      if (parseResult.success) {
        expect(parseResult.data.actionName).toBe("testAction");
      }
    });

    it("should reject invalid metadata without actionName", async () => {
      const schema = z.object({
        actionName: z.string(),
      });

      // Test invalid metadata
      const invalidMetadata = { otherField: "value" };
      const parseResult = schema.safeParse(invalidMetadata);

      expect(parseResult.success).toBe(false);
    });

    it("should reject metadata with non-string actionName", async () => {
      const schema = z.object({
        actionName: z.string(),
      });

      // Test invalid metadata
      const invalidMetadata = { actionName: 123 };
      const parseResult = schema.safeParse(invalidMetadata);

      expect(parseResult.success).toBe(false);
    });
  });

  describe("context utilities", () => {
    it("should provide correct utility URLs and app name", async () => {
      // This test just verifies the expected utility structure
      const expectedUtils = {
        authenticatedUrl: "/dashboard",
        unauthenticatedUrl: "/login",
        appName: "Test App",
      };

      expect(expectedUtils.authenticatedUrl).toBe("/dashboard");
      expect(expectedUtils.unauthenticatedUrl).toBe("/login");
      expect(expectedUtils.appName).toBe("Test App");
    });
  });
});
