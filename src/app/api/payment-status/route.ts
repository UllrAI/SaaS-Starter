import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { billing } from "@/lib/billing";
import { checkRateLimit, getClientRateLimitKey } from "@/lib/rate-limit";

const PAYMENT_STATUS_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PAYMENT_STATUS_RATE_LIMIT_MAX_REQUESTS = 30;

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
      const checkout = await billing.getCheckoutStatus(checkoutId);

      if (checkout.ownerId !== session.user.id) {
        return privateJson({ error: "Checkout not found" }, { status: 404 });
      }

      return privateJson({
        status: checkout.status,
        paymentMode: checkout.paymentMode,
      });
    } catch (error) {
      console.error("Error checking payment provider status:", error);
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
