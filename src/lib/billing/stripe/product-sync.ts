import type { PricingTier } from "@/lib/config/products";

import type { StripeEnvironment, StripePriceVariant } from "./prices";

export interface StripePriceSpec {
  tierId: string;
  productName: string;
  variant: StripePriceVariant;
  nickname: string;
  lookupKey: string;
  unitAmount: number;
  currency: Lowercase<PricingTier["currency"]>;
  recurring?: { interval: "month" | "year" };
}

export interface ResolvedStripePrice extends StripePriceSpec {
  priceId: string;
  created: boolean;
}

const VARIANTS: Array<{
  variant: StripePriceVariant;
  suffix: string;
  priceKey: keyof PricingTier["prices"];
  recurring?: { interval: "month" | "year" };
}> = [
  { variant: "oneTime", suffix: "Lifetime", priceKey: "oneTime" },
  {
    variant: "monthly",
    suffix: "Monthly",
    priceKey: "monthly",
    recurring: { interval: "month" },
  },
  {
    variant: "yearly",
    suffix: "Yearly",
    priceKey: "yearly",
    recurring: { interval: "year" },
  },
];

export function buildStripePriceSpecs(
  tiers: PricingTier[],
  productPrefix = "SaaS Starter",
): StripePriceSpec[] {
  const normalizedPrefix = productPrefix.trim() || "SaaS Starter";

  return tiers.flatMap((tier) =>
    VARIANTS.map((config) => ({
      tierId: tier.id,
      productName: `${normalizedPrefix} ${tier.name}`,
      variant: config.variant,
      nickname: `${tier.name} ${config.suffix}`,
      lookupKey: [normalizedPrefix, tier.id, config.variant]
        .join("_")
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, ""),
      unitAmount: Math.round(tier.prices[config.priceKey] * 100),
      currency: tier.currency.toLowerCase() as Lowercase<
        PricingTier["currency"]
      >,
      recurring: config.recurring,
    })),
  );
}

/**
 * How many rotated-out price IDs to keep per variant. Old IDs stay so webhooks
 * for subscriptions still on them can resolve a tier; the cap keeps the config
 * from growing without bound.
 */
export const PRICE_ID_HISTORY_LIMIT = 10;

/** Newest-first list with `priceId` promoted to the front, duplicates removed. */
export function mergePriceIdHistory(
  existingIds: string[],
  priceId: string,
): string[] {
  return [priceId, ...existingIds.filter((id) => id !== priceId)].slice(
    0,
    PRICE_ID_HISTORY_LIMIT,
  );
}

export function updatePricesConfigSource(
  source: string,
  resolvedPrices: ResolvedStripePrice[],
  environment: StripeEnvironment,
): string {
  return resolvedPrices.reduce((updatedSource, resolvedPrice) => {
    const tierBlock = getTierBlock(updatedSource, resolvedPrice.tierId);
    const environmentBlock = getEnvironmentBlock(tierBlock.block, environment);
    const fieldPattern = new RegExp(
      `(${resolvedPrice.variant}:\\s*\\[)([^\\]]*)(\\])`,
    );
    const field = fieldPattern.exec(environmentBlock.block);
    if (!field) {
      throw new Error(
        `Unable to find "${resolvedPrice.variant}" for tier "${resolvedPrice.tierId}" in ${environment}.`,
      );
    }

    const existingIds = [...field[2].matchAll(/"([^"]+)"/g)].map(
      (match) => match[1],
    );
    const nextIds = mergePriceIdHistory(existingIds, resolvedPrice.priceId);
    const nextEnvironmentBlock = environmentBlock.block.replace(
      fieldPattern,
      `$1${nextIds.map((id) => `"${id}"`).join(", ")}$3`,
    );
    const nextTierBlock =
      tierBlock.block.slice(0, environmentBlock.start) +
      nextEnvironmentBlock +
      tierBlock.block.slice(environmentBlock.end);

    return (
      updatedSource.slice(0, tierBlock.start) +
      nextTierBlock +
      updatedSource.slice(tierBlock.end)
    );
  }, source);
}

function getEnvironmentBlock(source: string, environment: StripeEnvironment) {
  const marker = `${environment}: {`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Unable to find ${environment} price configuration.`);
  }
  const end = source.indexOf("\n    },", start);
  if (end === -1) {
    throw new Error(`Unable to determine ${environment} price block.`);
  }
  return { start, end, block: source.slice(start, end) };
}

function getTierBlock(source: string, tierId: string) {
  const marker = `${tierId}: {`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Unable to find tier "${tierId}" in price config.`);
  }

  const rest = source.slice(start + marker.length);
  const nextTier = /\n  [A-Za-z0-9_-]+: \{/.exec(rest);
  const nextTierStart =
    nextTier?.index === undefined ? -1 : start + marker.length + nextTier.index;
  const configEnd = source.indexOf("\n};", start);
  const end =
    nextTierStart === -1 ? configEnd : Math.min(nextTierStart, configEnd);
  if (end === -1) {
    throw new Error(`Unable to determine tier "${tierId}" block.`);
  }

  return { start, end, block: source.slice(start, end) };
}
