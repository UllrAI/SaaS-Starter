import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { billing } from "@/lib/billing";
import {
  readTextBodyWithLimit,
  RequestBodyTooLargeError,
} from "@/lib/http/request-body";

const MAX_WEBHOOK_BODY_BYTES = 1024 * 1024;

function isCreemSignatureError(error: unknown) {
  return error instanceof Error && error.name === "CreemWebhookSignatureError";
}

function isInvalidWebhookPayloadError(error: unknown) {
  return error instanceof Error && error.name === "InvalidWebhookPayloadError";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readTextBodyWithLimit(
      request,
      MAX_WEBHOOK_BODY_BYTES,
    );
    const headersList = await headers();

    const signature = headersList.get("creem-signature");

    if (!signature) {
      console.warn("Webhook request missing 'creem-signature' header.");
      return NextResponse.json(
        { error: "Missing webhook signature header" },
        { status: 400 },
      );
    }

    // Pass the raw string payload for signature verification
    const result = await billing.handleWebhook(payload, signature);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";
    console.error(`[Creem Webhook Error]: ${message}`);

    if (error instanceof RequestBodyTooLargeError) {
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

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
