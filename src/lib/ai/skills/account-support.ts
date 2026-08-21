import type { AgentSkill } from "./types";

export const accountSupportSkill: AgentSkill = {
  id: "account-support",
  instructions: `You can answer questions about the user's own account.
Use the getAccountOverview tool to look up their profile and subscription before answering account or billing questions; never guess plan or subscription details.
For changes you cannot perform (upgrades, cancellations, refunds), point the user to the Billing page in the dashboard.`,
  toolNames: ["getAccountOverview"],
};
