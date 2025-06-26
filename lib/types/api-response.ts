import { z } from "zod";

// Base API response schema that can be extended
export const BaseApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

// Generic API response schema with typed data
export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return BaseApiResponseSchema.extend({
    data: dataSchema,
  });
}

// Common response types
export const EmptyApiResponseSchema = BaseApiResponseSchema.extend({
  data: z.null().optional(),
});

export const StringApiResponseSchema = createApiResponseSchema(z.string());
export const NumberApiResponseSchema = createApiResponseSchema(z.number());
export const BooleanApiResponseSchema = createApiResponseSchema(z.boolean());

// Array response schemas
export function createArrayApiResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
) {
  return createApiResponseSchema(z.array(itemSchema));
}

// Paginated response schema
export function createPaginatedApiResponseSchema<T extends z.ZodTypeAny>(
  itemSchema: T,
) {
  return BaseApiResponseSchema.extend({
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
  });
}

// Type exports for use in components
export type BaseApiResponse = z.infer<typeof BaseApiResponseSchema>;
export type EmptyApiResponse = z.infer<typeof EmptyApiResponseSchema>;

// Generic type for typed responses
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

// Helper function to create type-safe action client with specific response schema
export function createTypedOutputSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return createApiResponseSchema(dataSchema);
}
