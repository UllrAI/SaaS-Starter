import { NextRequest, NextResponse } from "next/server";
import { billing } from "@/lib/billing";
import { z } from "zod";
import { getUserSubscription } from "@/lib/database/subscription";
import { assertTrustedBillingUrl } from "@/lib/billing/url";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";

const checkoutSchema = z.object({
  tierId: z.string(),
  paymentMode: z.enum(["subscription", "one_time"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

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

    const body = await request.json();
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

    const { tierId, paymentMode, billingCycle } = parsedBody.data;

    if (paymentMode === "subscription") {
      const existingSubscription = await getUserSubscription(session.user.id);

      if (
        existingSubscription &&
        (existingSubscription.status === "active" ||
          existingSubscription.status === "trialing")
      ) {
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
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL is not set in environment variables.",
      );
    }

    const successUrl = new URL("/payment-status", appUrl);
    successUrl.searchParams.set("status", "success");

    const cancelUrl = new URL("/payment-status", appUrl);
    cancelUrl.searchParams.set("status", "cancelled");

    const failureUrl = new URL("/payment-status", appUrl);
    failureUrl.searchParams.set("status", "failed");

    const checkoutOptions = {
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
