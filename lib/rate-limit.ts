import type { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }

  async check(
    key: string,
    config: RateLimitConfig,
  ): Promise<{
    success: boolean;
    limit: number;
    used: number;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired entry
      const resetTime = now + config.windowMs;
      this.store.set(key, { count: 1, resetTime });

      return {
        success: true,
        limit: config.maxRequests,
        used: 1,
        remaining: config.maxRequests - 1,
        resetTime,
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        used: entry.count,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      success: true,
      limit: config.maxRequests,
      used: entry.count,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global rate limiter instance
const globalRateLimiter = new InMemoryRateLimiter();

export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getDefaultKey(req);
    const result = await globalRateLimiter.check(key, config);

    return {
      ...result,
      headers: {
        "X-RateLimit-Limit": config.maxRequests.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
      },
    };
  };
}

function getDefaultKey(req: NextRequest): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";

  return `${ip}:${req.nextUrl.pathname}`;
}

// Helper function to get client IP
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    keyGenerator: (req) => `auth:${getClientIP(req)}`,
  }),

  // Upload endpoints - moderate limits
  upload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => `upload:${getClientIP(req)}`,
  }),

  // File server upload - stricter limits
  fileUpload: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (req) => `file-upload:${getClientIP(req)}`,
  }),

  // Billing endpoints - strict limits
  billing: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (req) => `billing:${getClientIP(req)}`,
  }),

  // Payment status checks - more lenient
  paymentStatus: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyGenerator: (req) => `payment-status:${getClientIP(req)}`,
  }),

  // General API endpoints
  api: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    keyGenerator: (req) => `api:${getClientIP(req)}`,
  }),
};

// Rate limit error response
export function createRateLimitErrorResponse(result: {
  limit: number;
  used: number;
  remaining: number;
  resetTime: number;
}) {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: "Too many requests, please try again later.",
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
        "Retry-After": Math.ceil(
          (result.resetTime - Date.now()) / 1000,
        ).toString(),
      },
    },
  );
}

// Utility to add rate limiting to API routes
export function withRateLimit<T extends unknown[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>,
  rateLimiter: ReturnType<typeof createRateLimit>,
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const result = await rateLimiter(req);

    if (!result.success) {
      return createRateLimitErrorResponse(result);
    }

    const response = await handler(req, ...args);

    // Add rate limit headers to successful responses
    Object.entries(result.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
