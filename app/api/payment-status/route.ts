import { auth } from "@/lib/auth/server";
import { getUserSubscription } from "@/lib/database/subscription";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId =
      searchParams.get("sessionId") || searchParams.get("checkout_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Try to get user session, but don't require it for payment status check
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    // Check user's current subscription status if user is logged in
    const subscription = userId ? await getUserSubscription(userId) : null;

    if (subscription) {
      // User has a subscription, check its status
      if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        return NextResponse.json({
          status: "success",
          subscription,
          message: "Payment successful and subscription is active",
        });
      } else if (
        subscription.status === "past_due" ||
        subscription.status === "unpaid"
      ) {
        return NextResponse.json({
          status: "failed",
          subscription,
          message: "Payment failed or subscription is past due",
        });
      } else if (subscription.status === "canceled") {
        // If there's a sessionId, it means this is a payment flow
        // Don't treat existing canceled subscription as payment cancellation
        if (sessionId) {
          return NextResponse.json({
            status: "pending",
            message: "Payment is being processed",
            sessionId,
          });
        }
        return NextResponse.json({
          status: "cancelled",
          subscription,
          message: "Subscription has been cancelled",
        });
      }
    }

    // If no subscription found or status is unclear, check with payment provider
    if (sessionId) {
      try {
        // Check checkout status with Creem
        const { creemClient, creemApiKey } = await import(
          "@/lib/billing/creem/client"
        );

        const checkoutResponse = await creemClient.retrieveCheckout({
          xApiKey: creemApiKey,
          checkoutId: sessionId,
        });

        if (checkoutResponse?.status) {
          // Map Creem checkout status to our payment status
          switch (checkoutResponse.status) {
            case "completed":
              return NextResponse.json({
                status: "success",
                message: "Payment completed successfully",
                sessionId,
              });
            case "failed":
              return NextResponse.json({
                status: "failed",
                message: "Payment failed",
                sessionId,
              });
            case "canceled":
              return NextResponse.json({
                status: "cancelled",
                message: "Payment was cancelled",
                sessionId,
              });
            case "pending":
            case "processing":
            default:
              return NextResponse.json({
                status: "pending",
                message:
                  "Payment is being processed. This may take a few minutes.",
                sessionId,
              });
          }
        }

        // Fallback if no status available
        return NextResponse.json({
          status: "pending",
          message: "Payment is being processed. This may take a few minutes.",
          sessionId,
        });
      } catch (error) {
        console.error("Error checking Creem payment status:", error);
        // If we can't check with Creem, return pending to avoid false negatives
        return NextResponse.json({
          status: "pending",
          message: "Payment status is being verified. Please wait a moment.",
          sessionId,
        });
      }
    }

    // If no sessionId and no subscription, user might be checking status without context
    // Default to pending to avoid showing incorrect cancelled status
    return NextResponse.json({
      status: "pending",
      message: "Payment status is being verified",
    });
  } catch (error) {
    console.error("[Payment Status API Error]", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    );
  }
}
