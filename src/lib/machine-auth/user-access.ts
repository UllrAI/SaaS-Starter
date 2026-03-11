import { eq } from "drizzle-orm";
import { db } from "@/database";
import { users } from "@/database/schema";

export async function isMachineAuthUserActive(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      banned: true,
    },
  });

  return Boolean(user && !user.banned);
}

