import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { billing } from "@/lib/billing";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";
import { logCreemWebhook } from "@/lib/billing/creem/webhook-log";
import { SITE_CONFIG } from "@/lib/config/site";
import { integrationNotFound } from "@/lib/http/integration-response";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

function isCreemSignatureError(error: unknown) {
  return error instanceof Error && error.name === "CreemWebhookSignatureError";
}

function isInvalidWebhookPayloadError(error: unknown) {
  return error instanceof Error && error.name === "InvalidWebhookPayloadError";
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
    const headersList = await headers();

    const signature = headersList.get("creem-signature");

    if (!signature) {
      logCreemWebhook("warn", {
        eventId: null,
        eventType: null,
        outcome: "missing_signature",
      });
      return NextResponse.json(
        { error: "Missing webhook signature header" },
        { status: 400 },
      );
    }

    // Preserve the raw body exclusively for signature verification.
    delegatedToHandler = true;
    const result = await billing.handleWebhook(payload, signature);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      logCreemWebhook("warn", {
        eventId: null,
        eventType: null,
        outcome: "body_too_large",
      });
      return NextResponse.json(
        { error: "Webhook payload is too large" },
        { status: 413 },
      );
    }

    if (isCreemSignatureError(error)) {
      return NextResponse.json(
        { error: "Invalid signature." },
        { status: 400 },
      );
    }

    if (isInvalidWebhookPayloadError(error)) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

    if (!delegatedToHandler) {
      logCreemWebhook("error", {
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
