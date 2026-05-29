import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { billing } from "@/lib/billing";

function isCreemSignatureError(error: unknown) {
  return error instanceof Error && error.name === "CreemWebhookSignatureError";
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
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

    const status = isCreemSignatureError(error) ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
