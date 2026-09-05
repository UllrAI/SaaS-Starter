import { canManageSubscription, resolveBillingAccess } from "./access";
import type { ProductEntitlement, Subscription } from "@/types/billing";

const subscription: Subscription = {
  id: "sub-row",
  userId: "user-1",
  customerId: "customer-1",
  subscriptionId: "subscription-1",
  status: "active",
  tierId: "pro",
  currentPeriodEnd: new Date("2030-01-01T00:00:00Z"),
};

const entitlement: ProductEntitlement = {
  id: "entitlement-1",
  userId: "user-1",
  productId: "team",
  sourcePaymentId: "payment-1",
  revokedAt: null,
  revocationReason: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

describe("billing access", () => {
  it("keeps provider status separate from a local refund or dispute restriction", () => {
    expect(
      resolveBillingAccess({ ...subscription, accessRestricted: true }, null)
        .kind,
    ).toBe("free");
    expect(
      canManageSubscription({ ...subscription, accessRestricted: true }),
    ).toBe(true);
  });
  it("bounds active renewal grace and never extends trial or cancellation access", () => {
    const end = new Date("2030-01-01T00:00:00Z");
    const soon = new Date(end.getTime() + 60_000);
    const late = new Date(end.getTime() + 86_400_001);
    expect(resolveBillingAccess(subscription, null, soon).kind).toBe(
      "subscription",
    );
    expect(resolveBillingAccess(subscription, null, late).kind).toBe("free");
    expect(
      resolveBillingAccess({ ...subscription, status: "trialing" }, null, soon)
        .kind,
    ).toBe("free");
    expect(
      resolveBillingAccess(
        { ...subscription, status: "scheduled_cancel" },
        null,
        soon,
      ).kind,
    ).toBe("free");
    expect(
      resolveBillingAccess(
        { ...subscription, currentPeriodEnd: undefined },
        null,
      ).kind,
    ).toBe("free");
  });
  it("prefers a currently accessible subscription", () => {
    expect(resolveBillingAccess(subscription, entitlement).kind).toBe(
      "subscription",
    );
  });

  it.each(["expired", "past_due", "unpaid", "paused"] as const)(
    "falls back to lifetime access for a %s subscription",
    (status) => {
      expect(
        resolveBillingAccess({ ...subscription, status }, entitlement),
      ).toEqual({ kind: "lifetime", entitlement });
    },
  );

  it("keeps a canceled subscription active until period end", () => {
    expect(
      resolveBillingAccess(
        { ...subscription, status: "canceled" },
        entitlement,
        new Date("2029-01-01T00:00:00Z"),
      ).kind,
    ).toBe("subscription");
  });

  it("does not offer management for terminal subscriptions", () => {
    expect(canManageSubscription({ ...subscription, status: "expired" })).toBe(
      false,
    );
    expect(canManageSubscription({ ...subscription, status: "canceled" })).toBe(
      false,
    );
    expect(canManageSubscription({ ...subscription, status: "past_due" })).toBe(
      true,
    );
  });
});
