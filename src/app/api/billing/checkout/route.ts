import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { billing } from "@/lib/billing";
import { Session } from "@/types/auth";
import { z } from "zod";
import { getUserSubscription } from "@/lib/database/subscription";

const checkoutSchema = z.object({
  tierId: z.string(),
  paymentMode: z.enum(["subscription", "one_time"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

const BILLING_REDIRECT_HOSTS = ["creem.io"];
const BILLING_REDIRECT_HOST_SUFFIXES = [".creem.io"];

const assertTrustedBillingUrl = (url: string, label: string): string => {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid ${label}.`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error(`Invalid ${label}.`);
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (BILLING_REDIRECT_HOSTS.includes(hostname)) return parsedUrl.toString();
  if (
    BILLING_REDIRECT_HOST_SUFFIXES.some((suffix) =>
      hostname.endsWith(suffix),
    )
  ) {
    return parsedUrl.toString();
  }

  throw new Error(`Invalid ${label}.`);
};

export async function POST(request: NextRequest) {
  let session: Session | null = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsedBody = checkoutSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const { tierId, paymentMode, billingCycle } = parsedBody.data;

    // 仅在用户尝试购买新订阅时检查
    if (paymentMode === "subscription") {
      const existingSubscription = await getUserSubscription(session.user.id);

      // --- 修正点: 移除了 `&& existingSubscription.tierId !== tierId` ---
      // 只要存在任何有效的订阅，就阻止创建新的订阅。
      if (
        existingSubscription &&
        (existingSubscription.status === "active" ||
          existingSubscription.status === "trialing")
      ) {
        // 创建客户门户URL，以便前端可以引导用户去管理订阅
        const { portalUrl } = await billing.createCustomerPortalUrl(
          existingSubscription.customerId,
        );
        const safePortalUrl = assertTrustedBillingUrl(
          portalUrl,
          "management URL",
        );

        // 返回 409 Conflict 状态码，并附带管理链接
        return NextResponse.json(
          {
            error:
              "You already have an active subscription. Please manage your plan from the billing portal.",
            managementUrl: safePortalUrl,
          },
          { status: 409 },
        );
      }
    }

    // 使用 URL 对象构建各种状态的 URL，更安全健壮
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

    // 构建传递给 billing provider 的选项
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
      { error: "Failed to create checkout session. Please try again later." },
      { status: 500 },
    );
  }
}
