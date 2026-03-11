import type { PricingTier } from "@/lib/config/products";
import type {
  ProductBillingPeriod,
  ProductBillingType,
  ProductCurrency,
  ProductEntity,
} from "creem/models/components";

export type CreemProductVariant = keyof PricingTier["pricing"]["creem"];

export interface CreemProductSpec {
  tierId: string;
  tierName: string;
  variant: CreemProductVariant;
  name: string;
  description: string;
  price: number;
  currency: ProductCurrency;
  billingType: ProductBillingType;
  billingPeriod: ProductBillingPeriod;
}

export interface ResolvedCreemProduct extends CreemProductSpec {
  productId: string;
  created: boolean;
}

const CREEM_VARIANT_CONFIG: Record<
  CreemProductVariant,
  {
    suffix: string;
    billingType: ProductBillingType;
    billingPeriod: ProductBillingPeriod;
    priceKey: keyof PricingTier["prices"];
  }
> = {
  oneTime: {
    suffix: "Lifetime",
    billingType: "onetime",
    billingPeriod: "once",
    priceKey: "oneTime",
  },
  monthly: {
    suffix: "Monthly",
    billingType: "recurring",
    billingPeriod: "every-month",
    priceKey: "monthly",
  },
  yearly: {
    suffix: "Yearly",
    billingType: "recurring",
    billingPeriod: "every-year",
    priceKey: "yearly",
  },
};

const CREEM_VARIANT_ORDER: CreemProductVariant[] = [
  "oneTime",
  "monthly",
  "yearly",
];

export function buildCreemProductSpecs(
  tiers: PricingTier[],
  productPrefix?: string,
): CreemProductSpec[] {
  const normalizedPrefix = productPrefix?.trim();

  return tiers.flatMap((tier) =>
    CREEM_VARIANT_ORDER.map((variant) => {
      const config = CREEM_VARIANT_CONFIG[variant];
      const baseName = normalizedPrefix
        ? `${normalizedPrefix} ${tier.name}`
        : tier.name;

      return {
        tierId: tier.id,
        tierName: tier.name,
        variant,
        name: `${baseName} ${config.suffix}`,
        description: `${tier.name} plan (${config.suffix.toLowerCase()})`,
        price: toPriceInCents(tier.prices[config.priceKey]),
        currency: tier.currency,
        billingType: config.billingType,
        billingPeriod: config.billingPeriod,
      };
    }),
  );
}

export function findMatchingCreemProduct(
  products: ProductEntity[],
  spec: CreemProductSpec,
): ProductEntity | undefined {
  return products.find(
    (product) =>
      product.name === spec.name &&
      product.price === spec.price &&
      product.currency === spec.currency &&
      product.billingType === spec.billingType &&
      product.billingPeriod === spec.billingPeriod,
  );
}

export function updateProductsConfigSource(
  source: string,
  resolvedProducts: ResolvedCreemProduct[],
): string {
  return resolvedProducts.reduce((updatedSource, resolvedProduct) => {
    const tierBlock = getTierBlock(updatedSource, resolvedProduct.tierId);
    const fieldPattern = new RegExp(
      `(${resolvedProduct.variant}:\\s*")[^"]+(")`,
      "m",
    );

    if (!fieldPattern.test(tierBlock.block)) {
      throw new Error(
        `Unable to find "${resolvedProduct.variant}" field for tier "${resolvedProduct.tierId}".`,
      );
    }

    const updatedBlock = tierBlock.block.replace(
      fieldPattern,
      `$1${resolvedProduct.productId}$2`,
    );

    return (
      updatedSource.slice(0, tierBlock.start) +
      updatedBlock +
      updatedSource.slice(tierBlock.end)
    );
  }, source);
}

function getTierBlock(source: string, tierId: string) {
  const tierMarker = `id: "${tierId}"`;
  const start = source.indexOf(tierMarker);

  if (start === -1) {
    throw new Error(`Unable to find tier "${tierId}" in products config.`);
  }

  const nextTierStart = source.indexOf('\n  {\n    id: "', start + tierMarker.length);
  const arrayEnd = source.indexOf("\n];", start);
  const end =
    nextTierStart === -1 ? arrayEnd : Math.min(nextTierStart, arrayEnd);

  if (end === -1) {
    throw new Error(`Unable to determine block range for tier "${tierId}".`);
  }

  return {
    start,
    end,
    block: source.slice(start, end),
  };
}

function toPriceInCents(price: number): number {
  return Math.round(price * 100);
}
