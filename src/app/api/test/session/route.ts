import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/database";
import { users } from "@/database/schema";
import {
  createE2ESessionCookieValue,
  E2E_AUTH_COOKIE_NAME,
  E2ETestUser,
  shouldAllowE2ETestAccess,
} from "@/lib/auth/session";

const e2eUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "admin", "super_admin"]),
  image: z.string().nullable().optional(),
});

function notFoundResponse(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function upsertUser(user: E2ETestUser) {
  const now = new Date();
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, user.email))
    .limit(1);
  const persistedUser = {
    ...user,
    id: existingUser[0]?.id ?? user.id,
  };

  await db
    .insert(users)
    .values({
      id: persistedUser.id,
      email: persistedUser.email,
      name: persistedUser.name,
      image: persistedUser.image ?? null,
      role: persistedUser.role,
      emailVerified: true,
      banned: false,
      banReason: null,
      banExpires: null,
      paymentProviderCustomerId: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: persistedUser.email,
        name: persistedUser.name,
        image: persistedUser.image ?? null,
        role: persistedUser.role,
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: now,
      },
    });

  return persistedUser;
}

export async function POST(request: NextRequest) {
  if (!shouldAllowE2ETestAccess(request.headers.get("x-e2e-test-secret"))) {
    return notFoundResponse();
  }

  const body = await request.json();
  const parsedUser = e2eUserSchema.safeParse(body);

  if (!parsedUser.success) {
    return NextResponse.json(
      { error: "Invalid E2E session payload" },
      { status: 400 },
    );
  }

  const persistedUser = await upsertUser(parsedUser.data);

  const response = NextResponse.json({
    ok: true,
    userId: persistedUser.id,
  });
  response.cookies.set({
    name: E2E_AUTH_COOKIE_NAME,
    value: createE2ESessionCookieValue(persistedUser),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}

export async function DELETE(request: NextRequest) {
  if (!shouldAllowE2ETestAccess(request.headers.get("x-e2e-test-secret"))) {
    return notFoundResponse();
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (userId) {
    await db.delete(users).where(eq(users.id, userId));
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: E2E_AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
