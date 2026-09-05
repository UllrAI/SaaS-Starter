import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import { getFileReadUrl } from "@/lib/r2";

export async function GET(request: NextRequest) {
  if (!SITE_CONFIG.features.uploads) return new Response(null, { status: 404 });
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session) return new Response(null, { status: 401 });
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return new Response(null, { status: 404 });
  const admin =
    session.user.role === "admin" || session.user.role === "super_admin";
  const [file] = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.fileKey, key),
        admin ? undefined : eq(uploads.userId, session.user.id),
        isNull(uploads.deletedAt),
      ),
    )
    .limit(1);
  if (!file) return new Response(null, { status: 404 });
  const inline = /^(image|audio|video)\//.test(file.contentType);
  const response = NextResponse.redirect(
    await getFileReadUrl(
      file.fileKey,
      !inline || request.nextUrl.searchParams.get("download") === "1",
    ),
  );
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
