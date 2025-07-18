import { NextRequest, NextResponse } from "next/server";
import env from "@/env";

// Simple endpoint to test CORS configuration
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      message: "CORS test successful",
      timestamp: new Date().toISOString(),
      origin: request.headers.get("origin") || "unknown",
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": env.NEXT_PUBLIC_APP_URL,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": env.NEXT_PUBLIC_APP_URL,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
