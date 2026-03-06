import { NextRequest, NextResponse } from "next/server";

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
  status: string;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId =
      searchParams.get("checkout_id") || searchParams.get("sessionId");
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
          "Payment completed, but we still need the checkout reference to verify it.",
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
