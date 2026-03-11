import { NextRequest, NextResponse } from "next/server";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { revokeCliToken } from "@/lib/device-auth/token-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tokenId } = await params;
  const revoked = await revokeCliToken({
    tokenId,
    userId: session.user.id,
  });

  if (!revoked) {
    return NextResponse.json({ error: "CLI session not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

