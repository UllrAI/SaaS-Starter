import { NextRequest, NextResponse } from "next/server";
import { revokeApiKey } from "@/lib/api-keys/key-service";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyId } = await params;
  const revoked = await revokeApiKey({
    apiKeyId: keyId,
    userId: session.user.id,
  });

  if (!revoked) {
    return NextResponse.json({ error: "API key not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

