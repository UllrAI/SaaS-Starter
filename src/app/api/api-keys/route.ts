import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateApiKey, listApiKeys } from "@/lib/api-keys/key-service";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";

const createApiKeySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  rateLimit: z.coerce.number().int().positive().max(600).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listApiKeys(session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSessionFromHeaders(request.headers);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createApiKeySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const result = await generateApiKey({
    userId: session.user.id,
    name: parsed.data.name,
    rateLimit: parsed.data.rateLimit,
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  });

  return NextResponse.json(result, { status: 201 });
}

