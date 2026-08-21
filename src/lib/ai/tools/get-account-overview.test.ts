import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { ToolExecutionOptions } from "ai";
import type { AgentContext } from "../context";

const mockGetUserSubscription = jest.fn();
const siteConfig = {
  features: { emailAuth: true, billing: true, uploads: true, ai: true },
};

jest.mock("@/lib/database/subscription", () => ({
  getUserSubscription: mockGetUserSubscription,
}));

jest.mock("@/lib/config/site", () => ({
  get SITE_CONFIG() {
    return siteConfig;
  },
}));

const context: AgentContext = {
  userId: "user-1",
  userName: "Ada",
  userEmail: "ada@example.com",
  userRole: "user",
  locale: "en",
};

const executionOptions = {} as ToolExecutionOptions;

async function runTool(agentContext = context) {
  const { createGetAccountOverview } = await import("./get-account-overview");
  return (await createGetAccountOverview(agentContext).execute!(
    {},
    executionOptions,
  )) as {
    profile: { name: string; email: string; role: string };
    billingEnabled: boolean;
    subscription: {
      planId: string;
      status: string;
      currentPeriodEnd: string | null;
    } | null;
  };
}

describe("getAccountOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    siteConfig.features.billing = true;
  });

  it("returns the profile and subscription of the session user", async () => {
    mockGetUserSubscription.mockResolvedValue({
      tierId: "pro",
      status: "active",
      currentPeriodEnd: new Date("2026-01-01T00:00:00.000Z"),
      canceledAt: null,
    });

    const result = await runTool();

    expect(mockGetUserSubscription).toHaveBeenCalledWith("user-1");
    expect(result.profile).toEqual({
      name: "Ada",
      email: "ada@example.com",
      role: "user",
    });
    expect(result.subscription).toEqual({
      planId: "pro",
      status: "active",
      currentPeriodEnd: "2026-01-01T00:00:00.000Z",
      canceledAt: null,
    });
  });

  it("reports no subscription when the user has none", async () => {
    mockGetUserSubscription.mockResolvedValue(null);

    const result = await runTool();

    expect(result.subscription).toBeNull();
    expect(result.billingEnabled).toBe(true);
  });

  it("skips the billing lookup when billing is disabled", async () => {
    siteConfig.features.billing = false;

    const result = await runTool();

    expect(mockGetUserSubscription).not.toHaveBeenCalled();
    expect(result.billingEnabled).toBe(false);
    expect(result.subscription).toBeNull();
  });
});
