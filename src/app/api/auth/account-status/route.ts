import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { users } from "@/database/schema";
import { resolveAuthFeedback } from "@/lib/auth/feedback";

export async function GET(request: NextRequest) {
  const email = new URL(request.url).searchParams
    .get("email")
    ?.trim()
    .toLowerCase();

  if (!email) {
    return NextResponse.json({ status: "active" });
  }

  const [user] = await db
    .select({
      banned: users.banned,
      banReason: users.banReason,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user?.banned) {
    return NextResponse.json({ status: "active" });
  }

  return NextResponse.json({
    status: "banned",
    feedback: resolveAuthFeedback({
      error: "banned",
      banReason: user.banReason,
    }),
  });
}
