import { NextRequest, NextResponse } from "next/server";
import {
  checkPersistentRateLimit,
  getClientRateLimitKey,
} from "@/lib/rate-limit";

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

const URL_STATUS_MAP = {
  failed: {
    status: "failed",
    message: "Payment failed",
  },
  cancelled: {
    status: "cancelled",
    message: "Payment was cancelled",
  },
  pending: {
    status: "pending",
    message: "Payment is being processed. This may take a few minutes.",
  },
} as const;

function getCheckoutReference(searchParams: URLSearchParams): string | null {
  return (
    searchParams.get("checkout_id") ||
    searchParams.get("session_id") ||
    searchParams.get("sessionId")
  );
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await checkPersistentRateLimit({
      scope: "payment_status",
      key: getClientRateLimitKey(request),
      limit: PAYMENT_STATUS_RATE_LIMIT_MAX_REQUESTS,
      windowMs: PAYMENT_STATUS_RATE_LIMIT_WINDOW_MS,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
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
    const statusParam = searchParams.get("status");

    if (checkoutId) {
      try {
        const { creemClient } = await import("@/lib/billing/creem/client");
        const checkoutResponse =
          await creemClient.checkouts.retrieve(checkoutId);

        if (checkoutResponse?.status) {
          const normalizedStatus = String(
            checkoutResponse.status,
          ).toLowerCase();
          const resolvedStatus = resolveCheckoutStatus(normalizedStatus);
          return NextResponse.json({
            status: resolvedStatus.status,
            message: resolvedStatus.message,
            sessionId: checkoutId,
          });
        }

        return NextResponse.json({
          status: "pending",
          message: "Payment is being processed. This may take a few minutes.",
          sessionId: checkoutId,
        });
      } catch (error) {
        console.error("Error checking Creem payment status:", error);
        return NextResponse.json({
          status:
            statusParam === "failed" || statusParam === "cancelled"
              ? URL_STATUS_MAP[statusParam].status
              : "pending",
          message:
            statusParam === "failed" || statusParam === "cancelled"
              ? URL_STATUS_MAP[statusParam].message
              : "Payment status is being verified. Please wait a moment.",
          sessionId: checkoutId,
        });
      }
    }

    if (statusParam && statusParam in URL_STATUS_MAP) {
      return NextResponse.json(
        URL_STATUS_MAP[statusParam as keyof typeof URL_STATUS_MAP],
      );
    }

    if (statusParam === "success") {
      return NextResponse.json({
        status: "pending",
        message:
          "We received the checkout return, but still need the checkout reference to verify the payment.",
      });
    }

    return NextResponse.json(
      { error: "Checkout ID or status is required" },
      { status: 400 },
    );
  } catch (error) {
    console.error("[Payment Status API Error]", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
