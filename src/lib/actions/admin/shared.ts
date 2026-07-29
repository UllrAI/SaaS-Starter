import "server-only";

import { createSafeActionClient } from "next-safe-action";

import { requireAdmin } from "@/lib/auth/permissions";

const actionClient = createSafeActionClient();

export const adminAction = actionClient.use(async ({ next }) => {
  const user = await requireAdmin();
  return next({ ctx: { user } });
});
