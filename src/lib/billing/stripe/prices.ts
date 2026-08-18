import { getProductTierById, type PricingTier } from "@/lib/config/products";

export type StripeEnvironment = "test_mode" | "live_mode";
export type StripePriceVariant = "oneTime" | "monthly" | "yearly";
export type StripePriceIds = Record<StripePriceVariant, string>;

export const STRIPE_PRICE_IDS: Record<
  string,
  Record<StripeEnvironment, StripePriceIds>
> = {
  plus: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
  pro: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
  team: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
};

export function getStripePriceIds(
  tierId: string,
  environment: StripeEnvironment,
): StripePriceIds | undefined {
  return STRIPE_PRICE_IDS[tierId]?.[environment];
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
    if (
      priceGroups.some((priceIds) => Object.values(priceIds).includes(priceId))
    ) {
      return getProductTierById(tierId);
    }
  }

  return undefined;
}
