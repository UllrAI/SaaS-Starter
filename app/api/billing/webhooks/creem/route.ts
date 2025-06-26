import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { billing } from "@/lib/billing";
import {
  createApiError,
  handleApiError,
  API_ERROR_CODES,
  type ErrorLogContext,
} from "@/lib/api-error-handler";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const headersList = await headers();

    const signature = headersList.get("creem-signature");

    if (!signature) {
      console.warn("Webhook request missing 'creem-signature' header.");
      return createApiError(
        API_ERROR_CODES.MISSING_REQUIRED_FIELD,
        "Missing webhook signature header",
        400,
      );
    }

    // Pass the raw string payload for signature verification
    const result = await billing.handleWebhook(payload, signature);

    return NextResponse.json(result);
  } catch (error) {
    const context: ErrorLogContext = {
      endpoint: "/api/billing/webhooks/creem",
      method: "POST",
      error,
    };

    return handleApiError(error, context);
  }
}
