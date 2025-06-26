import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { billing } from "@/lib/billing";
import { Session } from "@/types/auth";
import { z } from "zod";
import { getUserSubscription } from "@/lib/database/subscription";
import { rateLimiters } from "@/lib/rate-limit";
import {
  createRateLimitError,
  createAuthError,
  createValidationError,
  createConflictError,
  handleApiError,
  addRateLimitHeaders,
  type ErrorLogContext,
} from "@/lib/api-error-handler";

const checkoutSchema = z.object({
  tierId: z.string(),
  paymentMode: z.enum(["subscription", "one_time"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

export async function POST(request: NextRequest) {
  let session: Session | null = null;
  try {
    // Rate limiting check
    const rateLimitResult = await rateLimiters.billing(request);
    if (!rateLimitResult.success) {
      return createRateLimitError(
        rateLimitResult,
        "Too many billing requests, please try again later.",
      );
    }

    session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return createAuthError();
    }

    const body = await request.json();
    const parsedBody = checkoutSchema.safeParse(body);

    if (!parsedBody.success) {
      return createValidationError(parsedBody.error, "Invalid request body");
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

        // 返回 409 Conflict 状态码，并附带管理链接
        return createConflictError(
          "You already have an active subscription. Please manage your plan from the billing portal.",
          { managementUrl: portalUrl },
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

    const response = NextResponse.json({ checkoutUrl });

    // Add rate limit headers to response
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    const context: ErrorLogContext = {
      endpoint: "/api/billing/checkout",
      method: "POST",
      userId: session?.user?.id,
      error,
    };

    return handleApiError(error, context);
  }
}
