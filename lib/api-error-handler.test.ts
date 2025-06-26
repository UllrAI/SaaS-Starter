/**
 * @jest-environment node
 */
import { ZodError, z } from "zod";
import {
  createApiError,
  createRateLimitError,
  createValidationError,
  createAuthError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createInternalServerError,
  handleApiError,
  addRateLimitHeaders,
  API_ERROR_CODES,
  type ErrorLogContext,
} from "./api-error-handler";

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe("API Error Handler", () => {
  describe("createApiError", () => {
    it("should create a standardized error response", async () => {
      const response = createApiError(
        API_ERROR_CODES.INVALID_REQUEST,
        "Test error message",
        400,
        { field: "test" },
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Invalid Request",
        code: "INVALID_REQUEST",
        message: "Test error message",
        details: { field: "test" },
        timestamp: expect.any(String),
      });
    });

    it("should create error response without details", async () => {
      const response = createApiError(
        API_ERROR_CODES.UNAUTHORIZED,
        "Unauthorized access",
        401,
      );

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        message: "Unauthorized access",
        timestamp: expect.any(String),
      });
      expect(body.details).toBeUndefined();
    });
  });

  describe("createRateLimitError", () => {
    it("should create rate limit error with proper headers", async () => {
      const rateLimitResult = {
        limit: 10,
        remaining: 0,
        resetTime: Date.now() + 60000, // 1 minute from now
      };

      const response = createRateLimitError(rateLimitResult);

      expect(response.status).toBe(429);
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBe("60");

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Rate Limit Exceeded",
        code: "RATE_LIMIT_EXCEEDED",
        message: "Rate limit exceeded. Please try again later.",
        details: {
          retryAfter: 60,
          limit: 10,
          remaining: 0,
        },
      });
    });

    it("should accept custom message", async () => {
      const rateLimitResult = {
        limit: 5,
        remaining: 0,
        resetTime: Date.now() + 30000,
      };

      const response = createRateLimitError(
        rateLimitResult,
        "Too many upload requests",
      );

      const body = await response.json();
      expect(body.message).toBe("Too many upload requests");
    });
  });

  describe("createValidationError", () => {
    it("should handle Zod validation errors", async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: "invalid-email", age: 15 });
      } catch (zodError) {
        if (zodError instanceof ZodError) {
          const response = createValidationError(zodError);

          expect(response.status).toBe(400);

          const body = await response.json();
          expect(body).toMatchObject({
            error: "Invalid Request",
            code: "INVALID_REQUEST",
            message: "Request validation failed",
            details: {
              fieldErrors: expect.objectContaining({
                email: expect.any(Array),
                age: expect.any(Array),
              }),
            },
          });
        }
      }
    });

    it("should accept custom validation message", async () => {
      const schema = z.object({ name: z.string().min(1) });

      try {
        schema.parse({ name: "" });
      } catch (zodError) {
        if (zodError instanceof ZodError) {
          const response = createValidationError(
            zodError,
            "Custom validation message",
          );

          const body = await response.json();
          expect(body.message).toBe("Custom validation message");
        }
      }
    });
  });

  describe("createAuthError", () => {
    it("should create authentication error", async () => {
      const response = createAuthError();

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Unauthorized",
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    });

    it("should accept custom message", async () => {
      const response = createAuthError("Invalid session token");

      const body = await response.json();
      expect(body.message).toBe("Invalid session token");
    });
  });

  describe("createForbiddenError", () => {
    it("should create forbidden error", async () => {
      const response = createForbiddenError();

      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Forbidden",
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    });
  });

  describe("createNotFoundError", () => {
    it("should create not found error", async () => {
      const response = createNotFoundError("User");

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Resource Not Found",
        code: "RESOURCE_NOT_FOUND",
        message: "User not found",
      });
    });

    it("should accept custom message", async () => {
      const response = createNotFoundError(
        "User",
        "User with ID 123 not found",
      );

      const body = await response.json();
      expect(body.message).toBe("User with ID 123 not found");
    });
  });

  describe("createConflictError", () => {
    it("should create conflict error", async () => {
      const response = createConflictError("Resource already exists");

      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Resource Conflict",
        code: "RESOURCE_CONFLICT",
        message: "Resource already exists",
      });
    });

    it("should include details", async () => {
      const details = { existingId: "123", conflictField: "email" };
      const response = createConflictError("Email already exists", details);

      const body = await response.json();
      expect(body.details).toEqual(details);
    });
  });

  describe("createInternalServerError", () => {
    it("should create internal server error with logging", async () => {
      const context: ErrorLogContext = {
        endpoint: "/api/test",
        method: "POST",
        userId: "user123",
        error: new Error("Test error"),
      };

      const response = createInternalServerError(context);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toMatchObject({
        error: "Internal Server Error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error. Please try again later.",
      });

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[API Error] /api/test:"),
        expect.objectContaining({
          endpoint: "/api/test",
          method: "POST",
          userId: "user123",
        }),
      );
    });
  });

  describe("handleApiError", () => {
    const baseContext: ErrorLogContext = {
      endpoint: "/api/test",
      method: "POST",
    };

    it("should handle ZodError", async () => {
      const schema = z.object({ name: z.string() });
      let zodError: ZodError;

      try {
        schema.parse({ name: 123 });
      } catch (error) {
        zodError = error as ZodError;
      }

      const response = handleApiError(zodError!, baseContext);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.code).toBe("INVALID_REQUEST");
    });

    it("should handle unauthorized errors", async () => {
      const error = new Error("Unauthorized access denied");
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.code).toBe("UNAUTHORIZED");
    });

    it("should handle not found errors", async () => {
      const error = new Error("Resource not found in database");
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.code).toBe("RESOURCE_NOT_FOUND");
    });

    it("should handle conflict errors", async () => {
      const error = new Error("Duplicate entry detected");
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body.code).toBe("RESOURCE_CONFLICT");
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe("DATABASE_ERROR");
    });

    it("should handle unknown errors as internal server error", async () => {
      const error = new Error("Some unknown error");
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should handle non-Error objects", async () => {
      const error = "String error";
      const response = handleApiError(error, baseContext);

      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    });
  });

  describe("addRateLimitHeaders", () => {
    it("should add rate limit headers to response", () => {
      // Create a mock NextResponse-like object
      const mockResponse = {
        headers: new Headers({ "Content-Type": "application/json" }),
      };

      const rateLimitResult = {
        limit: 100,
        remaining: 95,
        resetTime: Date.now() + 3600000, // 1 hour from now
      };

      const response = addRateLimitHeaders(
        mockResponse as { headers: Headers },
        rateLimitResult,
      );

      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("95");
      expect(response.headers.get("X-RateLimit-Reset")).toBeTruthy();
    });
  });

  describe("API_ERROR_CODES", () => {
    it("should contain all expected error codes", () => {
      expect(API_ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(API_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
      expect(API_ERROR_CODES.INTERNAL_SERVER_ERROR).toBe(
        "INTERNAL_SERVER_ERROR",
      );
      expect(API_ERROR_CODES.INVALID_FILE_TYPE).toBe("INVALID_FILE_TYPE");
      expect(API_ERROR_CODES.PAYMENT_FAILED).toBe("PAYMENT_FAILED");
    });
  });
});
