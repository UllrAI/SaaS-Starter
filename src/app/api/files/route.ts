import { and, desc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/database";
import { uploads } from "@/database/schema";
import { getAuthSessionFromHeaders } from "@/lib/auth/session";
import { SITE_CONFIG } from "@/lib/config/site";
import { requestFileDeletion } from "@/lib/uploads/deletion";
import { buildFileUrl } from "@/lib/uploads/url";

export async function GET(request: NextRequest) {
  if (!SITE_CONFIG.features.uploads) return new Response(null, { status: 404 });
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session) return new Response(null, { status: 401 });
  const page = z.coerce
    .number()
    .int()
    .min(0)
    .max(10000)
    .safeParse(request.nextUrl.searchParams.get("page") ?? 0);
  if (!page.success) return new Response(null, { status: 400 });
  const files = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.userId, session.user.id), isNull(uploads.deletedAt)))
    .orderBy(desc(uploads.createdAt), desc(uploads.id))
    .limit(21)
    .offset(page.data * 20);
  return NextResponse.json(
    {
      files: files.slice(0, 20).map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        url: buildFileUrl(file.fileKey),
      })),
      hasMore: files.length > 20,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  if (!SITE_CONFIG.features.uploads) return new Response(null, { status: 404 });
  const session = await getAuthSessionFromHeaders(request.headers);
  if (!session) return new Response(null, { status: 401 });
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("id"));
  if (!id.success) return new Response(null, { status: 400 });
  // The personal file API never grants administrative deletion permissions.
  const deleted = await requestFileDeletion(db, [id.data], {
    id: session.user.id,
    role: "user",
  });
  return new Response(null, { status: deleted.length ? 204 : 404 });
}
