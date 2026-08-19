import { getProductTierById, type PricingTier } from "@/lib/config/products";

export type StripeEnvironment = "test_mode" | "live_mode";
export type StripePriceVariant = "oneTime" | "monthly" | "yearly";

/**
 * A Stripe Product is the stable identity of a tier. Prices can be replaced
 * whenever an amount changes without changing the product or keeping an
 * unbounded list of retired price IDs in source control.
 */
export type StripeCatalogItem = Record<StripePriceVariant, string> & {
  productId: string;
};

export const STRIPE_CATALOG: Record<
  string,
  Record<StripeEnvironment, StripeCatalogItem>
> = {
  plus: {
    test_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
  pro: {
    test_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
  team: {
    test_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      productId: "",
      oneTime: "",
      monthly: "",
      yearly: "",
    },
  },
};

export function getStripeCatalogItem(
  tierId: string,
  environment: StripeEnvironment,
): StripeCatalogItem | undefined {
  return STRIPE_CATALOG[tierId]?.[environment];
}

/** The price ID new checkouts should use for this tier and variant. */
export function getActiveStripePriceId(
  tierId: string,
  environment: StripeEnvironment,
  variant: StripePriceVariant,
): string | undefined {
  return getStripeCatalogItem(tierId, environment)?.[variant] || undefined;
}

export function getProductTierByStripeProductId(
  productId: string,
  environment?: StripeEnvironment,
): PricingTier | undefined {
  if (!productId.trim()) return undefined;

  for (const [tierId, catalogByEnvironment] of Object.entries(STRIPE_CATALOG)) {
    const entries = environment
      ? [catalogByEnvironment[environment]]
      : Object.values(catalogByEnvironment);
    const matches = entries.some((entry) => entry.productId === productId);
    if (matches) return getProductTierById(tierId);
  }

  return undefined;
}
