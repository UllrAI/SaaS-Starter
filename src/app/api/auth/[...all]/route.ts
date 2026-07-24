import { auth } from "@/lib/auth/server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

const handlers = toNextJsHandler(auth.handler);

export const GET = handlers.GET;

export function POST(request: Request) {
  if (new URL(request.url).pathname.startsWith("/api/auth/admin/")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return handlers.POST(request);
}
