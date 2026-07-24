import type { ProductEntitlement, Subscription } from "@/types/billing";

const ACCESS_STATUSES = new Set(["active", "trialing", "scheduled_cancel"]);
const MANAGEABLE_STATUSES = new Set([
  "active",
  "trialing",
  "scheduled_cancel",
  "past_due",
  "unpaid",
  "paused",
  "incomplete",
]);

export function hasCurrentSubscriptionAccess(
  subscription: Subscription | null,
  now = new Date(),
): subscription is Subscription {
  if (!subscription) return false;
  if (ACCESS_STATUSES.has(subscription.status)) return true;

  return (
    subscription.status === "canceled" &&
    Boolean(
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > now,
    )
  );
}

export function canManageSubscription(
  subscription: Subscription | null,
): subscription is Subscription {
  return Boolean(subscription && MANAGEABLE_STATUSES.has(subscription.status));
}

export function resolveBillingAccess(
  subscription: Subscription | null,
  entitlement: ProductEntitlement | null,
  now = new Date(),
) {
  if (hasCurrentSubscriptionAccess(subscription, now)) {
    return { kind: "subscription" as const, subscription };
  }
  if (entitlement) {
    return { kind: "lifetime" as const, entitlement };
  }
  return { kind: "free" as const };
}
