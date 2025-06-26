import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { billing } from "@/lib/billing";
import { getUserSubscription } from "@/lib/database/subscription";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.customerId) {
      return NextResponse.json(
        { error: "No active subscription found for this user." },
        { status: 404 },
      );
    }

    const { portalUrl } = await billing.createCustomerPortalUrl(
      subscription.customerId,
    );

    return NextResponse.json({ portalUrl });
  } catch (error) {
    console.error("[Portal API Error]", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
