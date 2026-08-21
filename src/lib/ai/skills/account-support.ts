import { createGetAccountOverview } from "../tools/get-account-overview";
import type { AgentSkill } from "./types";

export const accountSupportSkill: AgentSkill = {
  id: "account-support",
  description:
    "Answers questions about the signed-in user's own account, plan, and subscription.",
  instructions: `You can answer questions about the user's own account.
Use the getAccountOverview tool to look up their profile and subscription before answering account or billing questions; never guess plan or subscription details.
For changes you cannot perform (upgrades, cancellations, refunds), point the user to the Billing page in the dashboard.`,
  tools: (context) => ({
    getAccountOverview: createGetAccountOverview(context),
  }),
};
