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
      productId: "prod_V6eg0UZMwGjBT6",
      oneTime: "price_1U6RMjB9KYdWZZKtlQUyf7aW",
      monthly: "price_1U6RMkB9KYdWZZKtImJZZsqe",
      yearly: "price_1U6RMkB9KYdWZZKtxrLaUgRf",
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
      productId: "prod_V6egfyOPZCZZYI",
      oneTime: "price_1U6RMlB9KYdWZZKtkzZEqTNY",
      monthly: "price_1U6RMmB9KYdWZZKtudqfcH8X",
      yearly: "price_1U6RMnB9KYdWZZKtDuKMIn0g",
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
      productId: "prod_V6egOauLh3UuUg",
      oneTime: "price_1U6RMoB9KYdWZZKtLepHKFnh",
      monthly: "price_1U6RMoB9KYdWZZKtMnyLViuT",
      yearly: "price_1U6RMpB9KYdWZZKtpXWw05x6",
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
