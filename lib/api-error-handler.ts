/**
 * Standardized API error handling utility
 * Provides consistent error responses across all API endpoints
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// Standard error codes for the application
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",

  // Request Validation
  INVALID_REQUEST: "INVALID_REQUEST",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_VALUE: "INVALID_FIELD_VALUE",

  // Resource Management
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  RESOURCE_LIMIT_EXCEEDED: "RESOURCE_LIMIT_EXCEEDED",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // File Upload
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_UPLOAD_FAILED: "FILE_UPLOAD_FAILED",

  // Payment & Billing
  PAYMENT_FAILED: "PAYMENT_FAILED",
  SUBSCRIPTION_CONFLICT: "SUBSCRIPTION_CONFLICT",
  BILLING_ERROR: "BILLING_ERROR",

  // Server Errors
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// Structured error detail types
export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: string | number | boolean;
}

export interface RateLimitErrorDetails {
  limit: number;
  remaining: number;
  resetTime: string;
}

export interface AuthenticationErrorDetails {
  requiredRole?: string;
  currentRole?: string;
  action?: string;
}

export interface FileUploadErrorDetails {
  fileName?: string;
  fileSize?: number;
  maxSize?: number;
  allowedTypes?: string[];
  actualType?: string;
}

export interface DatabaseErrorDetails {
  table?: string;
  operation?: string;
  constraint?: string;
}

export interface ZodErrorDetails {
  fieldErrors: Record<string, string[] | undefined>;
  formErrors: string[];
}

// Union type for all possible error details
export type ApiErrorDetails =
  | ValidationErrorDetails[]
  | RateLimitErrorDetails
  | AuthenticationErrorDetails
  | FileUploadErrorDetails
  | DatabaseErrorDetails
  | ZodErrorDetails
  | Record<string, string | number | boolean>
  | null;

// Standard error response interface with typed details
export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetails;
  timestamp: string;
  requestId?: string;
}

// Error logging interface
export interface ErrorLogContext {
  endpoint: string;
  method: string;
  userId?: string;
  error: unknown;
  request?: {
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
    body?: unknown;
  };
}

/**
 * Creates a standardized API error response
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: ApiErrorDetails,
  requestId?: string,
): NextResponse {
  const errorResponse: ApiErrorResponse = {
    error: getErrorTitle(code),
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId,
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * Handles rate limit exceeded errors with consistent format
 */
export function createRateLimitError(
  rateLimitResult: {
    limit: number;
    remaining: number;
    resetTime: number;
  },
  message: string = "Rate limit exceeded. Please try again later.",
): NextResponse {
  const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

  return new NextResponse(
    JSON.stringify({
      error: "Rate Limit Exceeded",
      code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message,
      details: {
        retryAfter,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
      },
      timestamp: new Date().toISOString(),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        "Retry-After": retryAfter.toString(),
      },
    },
  );
}

/**
 * Handles Zod validation errors with detailed field information
 */
export function createValidationError(
  zodError: ZodError,
  message: string = "Request validation failed",
): NextResponse {
  return createApiError(API_ERROR_CODES.INVALID_REQUEST, message, 400, {
    fieldErrors: zodError.flatten().fieldErrors,
    formErrors: zodError.flatten().formErrors,
  });
}

/**
 * Handles authentication errors
 */
export function createAuthError(
  message: string = "Authentication required",
): NextResponse {
  return createApiError(API_ERROR_CODES.UNAUTHORIZED, message, 401);
}

/**
 * Handles authorization/permission errors
 */
export function createForbiddenError(
  message: string = "Insufficient permissions",
): NextResponse {
  return createApiError(API_ERROR_CODES.FORBIDDEN, message, 403);
}

/**
 * Handles resource not found errors
 */
export function createNotFoundError(
  resource: string,
  message?: string,
): NextResponse {
  return createApiError(
    API_ERROR_CODES.RESOURCE_NOT_FOUND,
    message || `${resource} not found`,
    404,
  );
}

/**
 * Handles resource conflict errors (e.g., duplicate subscription)
 */
export function createConflictError(
  message: string,
  details?: ApiErrorDetails,
): NextResponse {
  return createApiError(
    API_ERROR_CODES.RESOURCE_CONFLICT,
    message,
    409,
    details,
  );
}

/**
 * Handles internal server errors with proper logging
 */
export function createInternalServerError(
  context: ErrorLogContext,
  message: string = "Internal server error. Please try again later.",
): NextResponse {
  // Log the error for monitoring
  logError(context);

  return createApiError(API_ERROR_CODES.INTERNAL_SERVER_ERROR, message, 500);
}

/**
 * Comprehensive error handler that categorizes different error types
 */
export function handleApiError(
  error: unknown,
  context: ErrorLogContext,
): NextResponse {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createValidationError(error);
  }

  // Handle known API errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.toLowerCase().includes("unauthorized")) {
      return createAuthError(error.message);
    }

    if (error.message.toLowerCase().includes("not found")) {
      return createNotFoundError("Resource", error.message);
    }

    if (
      error.message.toLowerCase().includes("duplicate") ||
      error.message.toLowerCase().includes("conflict")
    ) {
      return createConflictError(error.message);
    }

    // Check for database errors
    if (
      error.message.toLowerCase().includes("database") ||
      error.message.toLowerCase().includes("sql") ||
      error.message.toLowerCase().includes("connection")
    ) {
      logError({ ...context, error });
      return createApiError(
        API_ERROR_CODES.DATABASE_ERROR,
        "Database operation failed. Please try again later.",
        500,
      );
    }
  }

  // Default to internal server error
  return createInternalServerError(context);
}

/**
 * Adds rate limit headers to any response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: {
    limit: number;
    remaining: number;
    resetTime: number;
  },
): NextResponse {
  response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString());
  response.headers.set(
    "X-RateLimit-Remaining",
    rateLimitResult.remaining.toString(),
  );
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(rateLimitResult.resetTime).toISOString(),
  );
  return response;
}

// Helper functions

function getErrorTitle(code: ApiErrorCode): string {
  const titles: Record<ApiErrorCode, string> = {
    [API_ERROR_CODES.UNAUTHORIZED]: "Unauthorized",
    [API_ERROR_CODES.FORBIDDEN]: "Forbidden",
    [API_ERROR_CODES.INVALID_TOKEN]: "Invalid Token",
    [API_ERROR_CODES.INVALID_REQUEST]: "Invalid Request",
    [API_ERROR_CODES.MISSING_REQUIRED_FIELD]: "Missing Required Field",
    [API_ERROR_CODES.INVALID_FIELD_VALUE]: "Invalid Field Value",
    [API_ERROR_CODES.RESOURCE_NOT_FOUND]: "Resource Not Found",
    [API_ERROR_CODES.RESOURCE_CONFLICT]: "Resource Conflict",
    [API_ERROR_CODES.RESOURCE_LIMIT_EXCEEDED]: "Resource Limit Exceeded",
    [API_ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Rate Limit Exceeded",
    [API_ERROR_CODES.INVALID_FILE_TYPE]: "Invalid File Type",
    [API_ERROR_CODES.FILE_TOO_LARGE]: "File Too Large",
    [API_ERROR_CODES.FILE_UPLOAD_FAILED]: "File Upload Failed",
    [API_ERROR_CODES.PAYMENT_FAILED]: "Payment Failed",
    [API_ERROR_CODES.SUBSCRIPTION_CONFLICT]: "Subscription Conflict",
    [API_ERROR_CODES.BILLING_ERROR]: "Billing Error",
    [API_ERROR_CODES.INTERNAL_SERVER_ERROR]: "Internal Server Error",
    [API_ERROR_CODES.SERVICE_UNAVAILABLE]: "Service Unavailable",
    [API_ERROR_CODES.DATABASE_ERROR]: "Database Error",
  };

  return titles[code] || "Unknown Error";
}

function logError(context: ErrorLogContext): void {
  const logData = {
    timestamp: new Date().toISOString(),
    endpoint: context.endpoint,
    method: context.method,
    userId: context.userId,
    error: {
      message:
        context.error instanceof Error
          ? context.error.message
          : "Unknown error",
      stack: context.error instanceof Error ? context.error.stack : undefined,
      name:
        context.error instanceof Error ? context.error.name : "UnknownError",
    },
    request: context.request,
  };

  console.error(`[API Error] ${context.endpoint}:`, logData);
}
