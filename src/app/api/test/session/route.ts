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
  id: z.string().regex(/^e2e-[a-z0-9_-]+$/),
  email: z.string().email().endsWith("@e2e.local"),
  name: z.string().min(1),
  role: z.enum(["user", "admin", "super_admin"]),
  image: z.string().nullable().optional(),
});

function notFoundResponse(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function upsertUser(user: E2ETestUser) {
  const now = new Date();

  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
      role: user.role,
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
        email: user.email,
        name: user.name,
        image: user.image ?? null,
        role: user.role,
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: now,
      },
    });

  return user;
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
  const cookieValue = await createE2ESessionCookieValue(persistedUser);
  if (!cookieValue) {
    return notFoundResponse();
  }

  const response = NextResponse.json({
    ok: true,
    userId: persistedUser.id,
  });
  response.cookies.set({
    name: E2E_AUTH_COOKIE_NAME,
    value: cookieValue,
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
  if (userId?.startsWith("e2e-")) {
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
