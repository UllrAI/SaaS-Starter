import { NextRequest, NextResponse } from "next/server";
import { billing } from "@/lib/billing";
import { z } from "zod";
import {
  getUserSubscription,
  hasUserProductEntitlement,
} from "@/lib/database/subscription";
import { assertTrustedBillingUrl } from "@/lib/billing/url";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { getProductTierById } from "@/lib/config/products";
import { hasCurrentSubscriptionAccess } from "@/lib/billing/access";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_CHECKOUT_BODY_BYTES = 4 * 1024;
const CHECKOUT_RATE_LIMIT = 20;
const CHECKOUT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const tierIdSchema = z
  .string()
  .refine((tierId) => Boolean(getProductTierById(tierId)), {
    message: "Unknown product tier",
  });
const checkoutSchema = z.discriminatedUnion("paymentMode", [
  z.object({
    requestId: z.uuid(),
    tierId: tierIdSchema,
    paymentMode: z.literal("subscription"),
    billingCycle: z.enum(["monthly", "yearly"]),
  }),
  z.object({
    requestId: z.uuid(),
    tierId: tierIdSchema,
    paymentMode: z.literal("one_time"),
    billingCycle: z.never().optional(),
  }),
]);

export async function POST(request: NextRequest) {
  let session = null;
  try {
    session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user) {
      return NextResponse.json(
        { code: "login_required", error: "Unauthorized" },
        { status: 401 },
      );
    }

    const rateLimit = await checkRateLimit({
      scope: "billing_checkout",
      key: session.user.id,
      limit: CHECKOUT_RATE_LIMIT,
      windowMs: CHECKOUT_RATE_LIMIT_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      const retryAfter = Math.max(
        rateLimit.info.resetAt - Math.ceil(Date.now() / 1000),
        1,
      );
      return NextResponse.json(
        {
          code: "rate_limit_exceeded",
          error: "Too many checkout attempts. Please try again shortly.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      );
    }

    let body: unknown;
    try {
      body = await readJsonBodyWithLimit(request, MAX_CHECKOUT_BODY_BYTES);
    } catch (error) {
      return NextResponse.json(
        {
          code: "invalid_request",
          error:
            error instanceof RequestBodyTooLargeError
              ? "Request body is too large."
              : "Request body must be valid JSON.",
        },
        { status: error instanceof RequestBodyTooLargeError ? 413 : 400 },
      );
    }
    const parsedBody = checkoutSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          code: "invalid_request",
          error: "Invalid request body",
          details: parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { requestId, tierId, paymentMode, billingCycle } = parsedBody.data;

    if (paymentMode === "subscription") {
      const existingSubscription = await getUserSubscription(session.user.id);

      if (hasCurrentSubscriptionAccess(existingSubscription)) {
        const { portalUrl } = await billing.createCustomerPortalUrl(
          existingSubscription.customerId,
        );
        const safePortalUrl = assertTrustedBillingUrl(
          portalUrl,
          "management URL",
        );

        return NextResponse.json(
          {
            code: "subscription_active",
            error:
              "You already have an active subscription. Please manage your plan from the billing portal.",
            managementUrl: safePortalUrl,
          },
          { status: 409 },
        );
      }
    } else if (await hasUserProductEntitlement(session.user.id, tierId)) {
      return NextResponse.json(
        {
          code: "product_owned",
          error: "You already own this product.",
        },
        { status: 409 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is not set in environment variables.",
      );
    }

    const successUrl = new URL("/payment-status", appUrl);
    successUrl.searchParams.set("status", "pending");

    const cancelUrl = new URL("/payment-status", appUrl);
    cancelUrl.searchParams.set("status", "cancelled");

    const failureUrl = new URL("/payment-status", appUrl);
    failureUrl.searchParams.set("status", "failed");

    const checkoutOptions = {
      requestId,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      tierId,
      paymentMode,
      billingCycle,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      failureUrl: failureUrl.toString(),
    };

    const { checkoutUrl } =
      await billing.createCheckoutSession(checkoutOptions);

    const safeCheckoutUrl = assertTrustedBillingUrl(
      checkoutUrl,
      "checkout URL",
    );

    return NextResponse.json({ checkoutUrl: safeCheckoutUrl });
  } catch (error) {
    console.error("[Checkout API Error]", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id,
    });

    return NextResponse.json(
      {
        code: "checkout_failed",
        error: "Failed to create checkout session. Please try again later.",
      },
      { status: 500 },
    );
  }
}
