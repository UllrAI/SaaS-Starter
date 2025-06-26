import { z } from "zod";
import {
  BaseApiResponseSchema,
  createApiResponseSchema,
  ApiErrorDetails,
  ZodErrorDetails,
} from "./api-response";

describe("API Response Types", () => {
  describe("BaseApiResponseSchema", () => {
    it("should validate successful response", () => {
      const validResponse = {
        success: true,
        message: "Operation completed successfully",
      };

      const result = BaseApiResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.success).toBe(true);
        expect(result.data.message).toBe("Operation completed successfully");
      }
    });

    it("should validate basic error response", () => {
      const errorResponse = {
        success: false,
        message: "Validation failed",
      };

      const result = BaseApiResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.message).toBe("Validation failed");
      }
    });

    it("should require success field", () => {
      const invalidResponse = {
        message: "Missing success field",
      };

      const result = BaseApiResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should require message field", () => {
      const invalidResponse = {
        success: true,
      };

      const result = BaseApiResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should allow responses without extra fields", () => {
      const simpleResponse = {
        success: true,
        message: "Simple success response",
      };

      const result = BaseApiResponseSchema.safeParse(simpleResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("createApiResponseSchema", () => {
    it("should create schema with custom data type", () => {
      const UserSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
      });

      const UserResponseSchema = createApiResponseSchema(UserSchema);

      const validResponse = {
        success: true,
        message: "User retrieved successfully",
        data: {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
        },
      };

      const result = UserResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.data.id).toBe("123");
        expect(result.data.data.email).toBe("john@example.com");
      }
    });

    it("should reject invalid data type", () => {
      const UserSchema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      const UserResponseSchema = createApiResponseSchema(UserSchema);

      const invalidResponse = {
        success: true,
        message: "User retrieved",
        data: {
          id: 123, // Should be string
          email: "invalid-email", // Invalid email format
        },
      };

      const result = UserResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it("should work with primitive data types", () => {
      const StringResponseSchema = createApiResponseSchema(z.string());

      const validResponse = {
        success: true,
        message: "String retrieved",
        data: "Hello World",
      };

      const result = StringResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.data).toBe("Hello World");
      }
    });

    it("should work with array data types", () => {
      const ArrayResponseSchema = createApiResponseSchema(
        z.array(z.object({ id: z.number(), name: z.string() })),
      );

      const validResponse = {
        success: true,
        message: "Items retrieved",
        data: [
          { id: 1, name: "Item 1" },
          { id: 2, name: "Item 2" },
        ],
      };

      const result = ArrayResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.data).toHaveLength(2);
        expect(result.data.data[0].name).toBe("Item 1");
      }
    });
  });

  describe("ApiErrorDetails", () => {
    it("should accept valid error details", () => {
      const errorDetails: ApiErrorDetails = {
        code: "VALIDATION_ERROR",
        details: { field: "email", reason: "Invalid format" },
      };

      expect(errorDetails.code).toBe("VALIDATION_ERROR");
      expect(errorDetails.details).toEqual({
        field: "email",
        reason: "Invalid format",
      });
    });

    it("should allow optional details", () => {
      const errorDetails: ApiErrorDetails = {
        code: "NOT_FOUND",
      };

      expect(errorDetails.code).toBe("NOT_FOUND");
      expect(errorDetails.details).toBeUndefined();
    });
  });

  describe("ZodErrorDetails", () => {
    it("should structure zod error details correctly", () => {
      const zodError: ZodErrorDetails = {
        fieldErrors: {
          email: ["Invalid email format", "Email is required"],
          password: ["Password too short"],
        },
        formErrors: ["Form submission failed"],
      };

      expect(zodError.fieldErrors.email).toContain("Invalid email format");
      expect(zodError.fieldErrors.password).toHaveLength(1);
      expect(zodError.formErrors).toContain("Form submission failed");
    });

    it("should allow optional field and form errors", () => {
      const zodError1: ZodErrorDetails = {
        fieldErrors: { name: ["Required"] },
      };

      const zodError2: ZodErrorDetails = {
        formErrors: ["General error"],
      };

      const zodError3: ZodErrorDetails = {};

      expect(zodError1.fieldErrors.name).toBeDefined();
      expect(zodError1.formErrors).toBeUndefined();

      expect(zodError2.fieldErrors).toBeUndefined();
      expect(zodError2.formErrors).toBeDefined();

      expect(zodError3.fieldErrors).toBeUndefined();
      expect(zodError3.formErrors).toBeUndefined();
    });
  });

  describe("Integration tests", () => {
    it("should handle complex response structures", () => {
      const simpleResponse = {
        success: false,
        message: "Request validation failed",
      };

      const result = BaseApiResponseSchema.safeParse(simpleResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.success).toBe(false);
        expect(result.data.message).toBe("Request validation failed");
      }
    });

    it("should handle success response with complex data", () => {
      const ComplexDataSchema = z.object({
        user: z.object({
          id: z.string(),
          profile: z.object({
            name: z.string(),
            settings: z.object({
              theme: z.enum(["light", "dark"]),
              notifications: z.boolean(),
            }),
          }),
        }),
        metadata: z.object({
          timestamp: z.string(),
          version: z.number(),
        }),
      });

      const ComplexResponseSchema = createApiResponseSchema(ComplexDataSchema);

      const complexResponse = {
        success: true,
        message: "Complex data retrieved",
        data: {
          user: {
            id: "user-123",
            profile: {
              name: "John Doe",
              settings: {
                theme: "dark" as const,
                notifications: true,
              },
            },
          },
          metadata: {
            timestamp: "2024-01-01T00:00:00Z",
            version: 1,
          },
        },
      };

      const result = ComplexResponseSchema.safeParse(complexResponse);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.data.user.profile.settings.theme).toBe("dark");
        expect(result.data.data.metadata.version).toBe(1);
      }
    });
  });
});
