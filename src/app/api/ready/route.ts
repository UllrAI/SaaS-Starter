import { NextResponse } from "next/server";

import { checkDatabaseReadiness } from "@/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await checkDatabaseReadiness();
    return NextResponse.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable" },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": "5",
        },
      },
    );
  }
}
