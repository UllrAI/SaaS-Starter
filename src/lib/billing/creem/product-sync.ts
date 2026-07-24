import { createHash } from "node:crypto";
import type {
  CreemEnvironment,
  CreemProductVariant,
  PricingTier,
} from "@/lib/config/products";
import type { CreemClient, CreemProduct } from "./api-client";

type ProductBillingType = CreemProduct["billingType"];
type ProductBillingPeriod = "every-month" | "every-year";
type ProductCurrency = PricingTier["currency"];

export interface CreemProductSpec {
  tierId: string;
  tierName: string;
  variant: CreemProductVariant;
  name: string;
  description: string;
  price: number;
  currency: ProductCurrency;
  billingType: ProductBillingType;
  billingPeriod?: ProductBillingPeriod;
  taxMode: "exclusive";
  taxCategory: "saas";
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
    billingPeriod?: ProductBillingPeriod;
    priceKey: keyof PricingTier["prices"];
  }
> = {
  oneTime: {
    suffix: "Lifetime",
    billingType: "onetime",
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
        taxMode: "exclusive",
        taxCategory: "saas",
      };
    }),
  );
}

export function findMatchingCreemProduct(
  products: CreemProduct[],
  spec: CreemProductSpec,
): CreemProduct | undefined {
  return products.find(
    (product) =>
      product.name === spec.name &&
      product.description === spec.description &&
      product.price === spec.price &&
      product.currency === spec.currency &&
      product.billingType === spec.billingType &&
      product.billingPeriod === spec.billingPeriod &&
      product.status === "active" &&
      product.taxMode === spec.taxMode &&
      product.taxCategory === spec.taxCategory,
  );
}

export async function loadAllCreemProducts(
  client: CreemClient,
): Promise<CreemProduct[]> {
  const products: CreemProduct[] = [];
  let pageNumber = 1;
  const visitedPages = new Set<number>();

  while (true) {
    if (visitedPages.has(pageNumber)) {
      throw new Error(`Creem product pagination repeated page ${pageNumber}.`);
    }
    visitedPages.add(pageNumber);

    const page = await client.products.search(pageNumber, 100);
    products.push(...page.items);
    if (page.pagination.nextPage === null) {
      return products;
    }
    pageNumber = page.pagination.nextPage;
  }
}

export function buildCreemProductIdempotencyKey(
  environment: CreemEnvironment,
  spec: CreemProductSpec,
): string {
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        name: spec.name,
        description: spec.description,
        price: spec.price,
        currency: spec.currency,
        billingType: spec.billingType,
        billingPeriod: spec.billingPeriod,
        taxMode: spec.taxMode,
        taxCategory: spec.taxCategory,
      }),
    )
    .digest("hex")
    .slice(0, 32);

  return [
    "product-sync",
    environment,
    spec.tierId,
    spec.variant,
    fingerprint,
  ].join("-");
}

export function updateProductsConfigSource(
  source: string,
  resolvedProducts: ResolvedCreemProduct[],
  environment: CreemEnvironment,
): string {
  return resolvedProducts.reduce((updatedSource, resolvedProduct) => {
    const tierBlock = getTierBlock(updatedSource, resolvedProduct.tierId);
    const environmentBlock = getEnvironmentBlock(tierBlock.block, environment);
    const fieldPattern = new RegExp(
      `(${resolvedProduct.variant}:\\s*")[^"]*(")`,
      "m",
    );

    if (!fieldPattern.test(environmentBlock.block)) {
      throw new Error(
        `Unable to find "${resolvedProduct.variant}" field for tier "${resolvedProduct.tierId}" in ${environment}.`,
      );
    }

    const updatedEnvironmentBlock = environmentBlock.block.replace(
      fieldPattern,
      `$1${resolvedProduct.productId}$2`,
    );
    const updatedBlock =
      tierBlock.block.slice(0, environmentBlock.start) +
      updatedEnvironmentBlock +
      tierBlock.block.slice(environmentBlock.end);

    return (
      updatedSource.slice(0, tierBlock.start) +
      updatedBlock +
      updatedSource.slice(tierBlock.end)
    );
  }, source);
}

function getEnvironmentBlock(source: string, environment: CreemEnvironment) {
  const marker = `${environment}: {`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Unable to find ${environment} product configuration.`);
  }

  const end = source.indexOf("\n        },", start);
  if (end === -1) {
    throw new Error(`Unable to determine ${environment} product block.`);
  }

  return {
    start,
    end,
    block: source.slice(start, end),
  };
}

function getTierBlock(source: string, tierId: string) {
  const tierMarker = `id: "${tierId}"`;
  const start = source.indexOf(tierMarker);

  if (start === -1) {
    throw new Error(`Unable to find tier "${tierId}" in products config.`);
  }

  const nextTierStart = source.indexOf(
    '\n  {\n    id: "',
    start + tierMarker.length,
  );
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
