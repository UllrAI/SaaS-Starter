import { NextResponse } from "next/server";

type Integration = "billing" | "uploads";

export function integrationUnavailable(integration: Integration) {
  return NextResponse.json(
    {
      code: "integration_unavailable",
      error: `${integration === "billing" ? "Billing" : "Uploads"} is not enabled.`,
    },
    { status: 503 },
  );
}

export function integrationNotFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
