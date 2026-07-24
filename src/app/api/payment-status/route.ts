import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";

type ResolvedPaymentStatus = "success" | "failed" | "pending" | "cancelled";

const PAYMENT_STATUS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PAYMENT_STATUS_RATE_LIMIT_MAX_REQUESTS = 30;

const CHECKOUT_STATUS_MAP = {
  completed: {
    status: "success",
    message: "Payment completed successfully",
  },
  succeeded: {
    status: "success",
    message: "Payment completed successfully",
  },
  failed: {
    status: "failed",
    message: "Payment failed",
  },
  expired: {
    status: "failed",
    message: "Payment session expired",
  },
  canceled: {
    status: "cancelled",
    message: "Payment was cancelled",
  },
  cancelled: {
    status: "cancelled",
    message: "Payment was cancelled",
  },
  pending: {
    status: "pending",
    message: "Payment is being processed. This may take a few minutes.",
  },
  processing: {
    status: "pending",
    message: "Payment is being processed. This may take a few minutes.",
  },
  open: {
    status: "pending",
    message: "Payment is being processed. This may take a few minutes.",
  },
} as const;

function resolveCheckoutStatus(normalizedStatus: string): {
  status: ResolvedPaymentStatus;
  message: string;
} {
  return (
    CHECKOUT_STATUS_MAP[
      normalizedStatus as keyof typeof CHECKOUT_STATUS_MAP
    ] ?? {
      status: "pending",
      message: "Payment is being processed. This may take a few minutes.",
    }
  );
}

function getCheckoutReference(searchParams: URLSearchParams): string | null {
  const value =
    searchParams.get("checkout_id") ||
    searchParams.get("session_id") ||
    searchParams.get("sessionId");
  return value?.trim() || null;
}

function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

function getCheckoutOwnerId(checkout: { metadata?: unknown }): string | null {
  if (!checkout.metadata || typeof checkout.metadata !== "object") {
    return null;
  }

  const userId = (checkout.metadata as Record<string, unknown>).userId;
  return typeof userId === "string" ? userId : null;
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await checkRateLimit({
      scope: "payment_status",
      key: getClientRateLimitKey(request),
      limit: PAYMENT_STATUS_RATE_LIMIT_MAX_REQUESTS,
      windowMs: PAYMENT_STATUS_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return privateJson(
        { error: "Too many status checks. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(
                rateLimit.info.resetAt - Math.ceil(Date.now() / 1000),
                1,
              ),
            ),
            "X-RateLimit-Limit": String(rateLimit.info.limit),
            "X-RateLimit-Remaining": String(rateLimit.info.remaining),
            "X-RateLimit-Reset": String(rateLimit.info.resetAt),
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutId = getCheckoutReference(searchParams);
    if (!checkoutId || checkoutId.length > 255) {
      return privateJson(
        { error: "A valid checkout ID is required" },
        { status: 400 },
      );
    }

    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user?.id) {
      return privateJson({ error: "Authentication required" }, { status: 401 });
    }

    try {
      const { creemClient } = await import("@/lib/billing/creem/client");
      const checkoutResponse = await creemClient.checkouts.retrieve(checkoutId);

      if (getCheckoutOwnerId(checkoutResponse) !== session.user.id) {
        return privateJson({ error: "Checkout not found" }, { status: 404 });
      }

      const resolvedStatus = resolveCheckoutStatus(
        String(checkoutResponse.status ?? "").toLowerCase(),
      );
      return privateJson({
        status: resolvedStatus.status,
        message: resolvedStatus.message,
      });
    } catch (error) {
      console.error("Error checking Creem payment status:", error);
      return privateJson(
        { error: "Unable to verify payment status" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[Payment Status API Error]", error);
    return privateJson(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
