import { getProductTierById, type PricingTier } from "@/lib/config/products";

export type CreemEnvironment = "test_mode" | "live_mode";
export type CreemProductVariant = "oneTime" | "monthly" | "yearly";
export type CreemProductIds = Record<CreemProductVariant, string>;

export const CREEM_PRODUCT_IDS: Record<
  string,
  Record<CreemEnvironment, CreemProductIds>
> = {
  plus: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "prod_1xvCrHVxDLPdoptwdH8Ake",
      monthly: "prod_1szT3Q4qCWKYeIVk56FD0v",
      yearly: "prod_2DyqDup95VCqxUv7rB6zWD",
    },
  },
  pro: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "prod_707V6jfaKsrUb9HckzuWpA",
      monthly: "prod_6E1zx5skxroRjjbPGcHMGs",
      yearly: "prod_3vq08mIOjo04eWmDlM5LKB",
    },
  },
  team: {
    test_mode: {
      oneTime: "",
      monthly: "",
      yearly: "",
    },
    live_mode: {
      oneTime: "prod_2msXlwJ3tbbUUp7hVIKJWk",
      monthly: "prod_2ZXku6CgdRY38k7VQff0me",
      yearly: "prod_2l5IMno8y3iv7KPg5QBuWM",
    },
  },
};

export function getCreemProductIds(
  tierId: string,
  environment: CreemEnvironment,
): CreemProductIds | undefined {
  return CREEM_PRODUCT_IDS[tierId]?.[environment];
}

export function getProductTierByCreemProductId(
  productId: string,
  environment?: CreemEnvironment,
): PricingTier | undefined {
  if (!productId.trim()) return undefined;

  for (const [tierId, productIdsByEnvironment] of Object.entries(
    CREEM_PRODUCT_IDS,
  )) {
    const productGroups = environment
      ? [productIdsByEnvironment[environment]]
      : Object.values(productIdsByEnvironment);
    if (
      productGroups.some((productIds) =>
        Object.values(productIds).includes(productId),
      )
    ) {
      return getProductTierById(tierId);
    }
  }

  return undefined;
}
