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
  productId: string;
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

export function updatePricesConfigSource(
  source: string,
  resolvedPrices: ResolvedStripePrice[],
  environment: StripeEnvironment,
): string {
  return resolvedPrices.reduce((updatedSource, resolvedPrice) => {
    const tierBlock = getTierBlock(updatedSource, resolvedPrice.tierId);
    const environmentBlock = getEnvironmentBlock(tierBlock.block, environment);
    const productPattern = /(productId:\s*")([^"]*)(")/;
    const fieldPattern = new RegExp(
      `(${resolvedPrice.variant}:\\s*")([^"]*)(")`,
    );
    if (!productPattern.test(environmentBlock.block)) {
      throw new Error(
        `Unable to find "productId" for tier "${resolvedPrice.tierId}" in ${environment}.`,
      );
    }
    const field = fieldPattern.exec(environmentBlock.block);
    if (!field) {
      throw new Error(
        `Unable to find "${resolvedPrice.variant}" for tier "${resolvedPrice.tierId}" in ${environment}.`,
      );
    }

    const nextEnvironmentBlock = environmentBlock.block
      .replace(productPattern, `$1${resolvedPrice.productId}$3`)
      .replace(fieldPattern, `$1${resolvedPrice.priceId}$3`);
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
