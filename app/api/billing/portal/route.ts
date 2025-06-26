import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { billing } from "@/lib/billing";
import { getUserSubscription } from "@/lib/database/subscription";
import { rateLimiters } from "@/lib/rate-limit";
import {
  createRateLimitError,
  createAuthError,
  createNotFoundError,
  handleApiError,
  addRateLimitHeaders,
  type ErrorLogContext,
} from "@/lib/api-error-handler";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiters.billing(request);
    if (!rateLimitResult.success) {
      return createRateLimitError(
        rateLimitResult,
        "Too many billing requests, please try again later.",
      );
    }

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return createAuthError();
    }

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.customerId) {
      return createNotFoundError(
        "subscription",
        "No active subscription found for this user.",
      );
    }

    const { portalUrl } = await billing.createCustomerPortalUrl(
      subscription.customerId,
    );

    const response = NextResponse.json({ portalUrl });

    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    const context: ErrorLogContext = {
      endpoint: "/api/billing/portal",
      method: "GET",
      userId: undefined, // session might not be available in catch block
      error,
    };

    return handleApiError(error, context);
  }
}
