import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { billing } from "@/lib/billing";
import { logStripeWebhook } from "@/lib/billing/stripe/webhook-log";
import { SITE_CONFIG } from "@/lib/config/site";
import { integrationNotFound } from "@/lib/http/integration-response";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

function hasErrorName(error: unknown, name: string) {
  return error instanceof Error && error.name === name;
}

export async function POST(request: NextRequest) {
  if (!SITE_CONFIG.features.billing) {
    return integrationNotFound();
  }

  let delegatedToHandler = false;
  try {
    const payload = await readTextBodyWithLimit(
      request,
      MAX_WEBHOOK_BODY_BYTES,
    );
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      logStripeWebhook("warn", {
        eventId: null,
        eventType: null,
        outcome: "missing_signature",
      });
      return NextResponse.json(
        { error: "Missing Stripe-Signature header" },
        { status: 400 },
      );
    }

    delegatedToHandler = true;
    return NextResponse.json(await billing.handleWebhook(payload, signature));
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      logStripeWebhook("warn", {
        eventId: null,
        eventType: null,
        outcome: "body_too_large",
      });
      return NextResponse.json(
        { error: "Webhook payload is too large" },
        { status: 413 },
      );
    }

    if (hasErrorName(error, "StripeWebhookSignatureError")) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 400 },
      );
    }
    if (
      hasErrorName(error, "InvalidWebhookPayloadError") ||
      hasErrorName(error, "StripeWebhookEnvironmentError") ||
      hasErrorName(error, "StripeWebhookApiVersionError")
    ) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

    if (!delegatedToHandler) {
      logStripeWebhook("error", {
        eventId: null,
        eventType: null,
        outcome: "request_failed",
      });
    }
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
