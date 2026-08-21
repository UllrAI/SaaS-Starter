import { tool } from "ai";
import { z } from "zod";
import { getUserSubscription } from "@/lib/database/subscription";
import { SITE_CONFIG } from "@/lib/config/site";
import type { AgentContext } from "../context";

// Context-aware tool factory: the user id comes from the authenticated
// session, so the model can never query another user's account.
export function createGetAccountOverview(context: AgentContext) {
  return tool({
    description:
      "Get the signed-in user's account overview: profile basics and, when billing is enabled, the current subscription.",
    inputSchema: z.object({}),
    execute: async () => {
      const subscription = SITE_CONFIG.features.billing
        ? await getUserSubscription(context.userId)
        : null;

      return {
        profile: {
          name: context.userName,
          email: context.userEmail,
          role: context.userRole,
        },
        billingEnabled: SITE_CONFIG.features.billing,
        subscription: subscription
          ? {
              planId: subscription.tierId,
              status: subscription.status,
              currentPeriodEnd:
                subscription.currentPeriodEnd?.toISOString() ?? null,
              canceledAt: subscription.canceledAt?.toISOString() ?? null,
            }
          : null,
      };
    },
  });
}
