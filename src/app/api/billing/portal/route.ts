import { NextRequest, NextResponse } from "next/server";
import { billing } from "@/lib/billing";
import { getUserSubscription } from "@/lib/database/subscription";
import { assertTrustedBillingUrl } from "@/lib/billing/url";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { canManageSubscription } from "@/lib/billing/access";
import { SITE_CONFIG } from "@/lib/config/site";
import { integrationUnavailable } from "@/lib/http/integration-response";

export async function GET(request: NextRequest) {
  if (!SITE_CONFIG.features.billing) {
    return integrationUnavailable("billing");
  }

  try {
    const session = await getAuthSessionFromHeaders(request.headers);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);
    if (!canManageSubscription(subscription) || !subscription.customerId) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 },
      );
    }

    const { portalUrl } = await billing.createCustomerPortalUrl(
      subscription.customerId,
    );

    return NextResponse.json({
      portalUrl: assertTrustedBillingUrl(portalUrl, "management URL"),
    });
  } catch (error) {
    console.error("[Portal API Error]", error);
    return NextResponse.json(
      { error: "Unable to open the billing portal. Please try again later." },
      { status: 500 },
    );
  }
}
