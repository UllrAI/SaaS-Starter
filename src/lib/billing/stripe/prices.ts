import { getProductTierById, type PricingTier } from "@/lib/config/products";

export type StripeEnvironment = "test_mode" | "live_mode";
export type StripePriceVariant = "oneTime" | "monthly" | "yearly";

/**
 * Price IDs are stored newest-first. Index 0 is what new checkouts use; the
 * remaining entries are prices that were rotated out but may still be attached
 * to live subscriptions, so their webhooks can still resolve a tier.
 * `pnpm stripe:sync-products` maintains this history automatically.
 */
export type StripePriceIds = Record<StripePriceVariant, string[]>;

export const STRIPE_PRICE_IDS: Record<
  string,
  Record<StripeEnvironment, StripePriceIds>
> = {
  plus: {
    test_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
    live_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
  },
  pro: {
    test_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
    live_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
  },
  team: {
    test_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
    live_mode: {
      oneTime: [],
      monthly: [],
      yearly: [],
    },
  },
};

export function getStripePriceIds(
  tierId: string,
  environment: StripeEnvironment,
): StripePriceIds | undefined {
  return STRIPE_PRICE_IDS[tierId]?.[environment];
}

/** The price ID new checkouts should use for this tier and variant. */
export function getActiveStripePriceId(
  tierId: string,
  environment: StripeEnvironment,
  variant: StripePriceVariant,
): string | undefined {
  return getStripePriceIds(tierId, environment)?.[variant][0];
}

export function getProductTierByStripePriceId(
  priceId: string,
  environment?: StripeEnvironment,
): PricingTier | undefined {
  if (!priceId.trim()) return undefined;

  for (const [tierId, priceIdsByEnvironment] of Object.entries(
    STRIPE_PRICE_IDS,
  )) {
    const priceGroups = environment
      ? [priceIdsByEnvironment[environment]]
      : Object.values(priceIdsByEnvironment);
    const matches = priceGroups.some((priceIds) =>
      Object.values(priceIds).some((variantIds) =>
        variantIds.includes(priceId),
      ),
    );
    if (matches) return getProductTierById(tierId);
  }

  return undefined;
}
