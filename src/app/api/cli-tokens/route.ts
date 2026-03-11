import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { listCliTokens } from "@/lib/device-auth/token-service";

export async function GET(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await listCliTokens(session.user.id);
  return NextResponse.json({ tokens });
}

