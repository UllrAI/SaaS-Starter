export type ProductFeatureId =
  | "marketing-foundation"
  | "auth-dashboard"
  | "billing-flow"
  | "admin-operations"
  | "r2-uploads"
  | "localization-setup"
  | "implementation-guidance";

export interface ProductFeature {
  id: ProductFeatureId;
  included: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  isPopular: boolean;
  features: ProductFeature[];
  pricing: {
    creem: {
      oneTime: string;
      monthly: string;
      yearly: string;
    };
  };
  prices: {
    oneTime: number;
    monthly: number;
    yearly: number;
  };
  currency: "USD" | "EUR";
}

export const PRODUCT_TIERS: PricingTier[] = [
  {
    id: "plus",
    name: "Plus",
    isPopular: false,
    features: [
      { id: "marketing-foundation", included: true },
      { id: "auth-dashboard", included: true },
      { id: "billing-flow", included: true },
      { id: "admin-operations", included: false },
      { id: "r2-uploads", included: false },
      { id: "localization-setup", included: false },
      { id: "implementation-guidance", included: false },
    ],
    pricing: {
      creem: {
        oneTime: "prod_1HVwfBIaKkJh9CgS7zD37h",
        monthly: "prod_6uhcfBUcRxprqDvep0U5Jw",
        yearly: "prod_7LJkGVgv4LOBuucrxANo2b",
      },
    },
    prices: {
      oneTime: 19.99,
      monthly: 9.99,
      yearly: 99.99,
    },
    currency: "USD",
  },
  {
    id: "pro",
    name: "Professional",
    isPopular: true,
    features: [
      { id: "marketing-foundation", included: true },
      { id: "auth-dashboard", included: true },
      { id: "billing-flow", included: true },
      { id: "admin-operations", included: true },
      { id: "r2-uploads", included: true },
      { id: "localization-setup", included: true },
      { id: "implementation-guidance", included: false },
    ],
    pricing: {
      creem: {
        oneTime: "prod_6uhcfBUcRxprqDvep0U5Jw",
        monthly: "prod_6uhcfBUcRxprqDvep0U5Jw",
        yearly: "prod_6uhcfBUcRxprqDvep0U5Jw",
      },
    },
    prices: {
      oneTime: 29.99,
      monthly: 19.99,
      yearly: 199.99,
    },
    currency: "USD",
  },
  {
    id: "team",
    name: "Team",
    isPopular: false,
    features: [
      { id: "marketing-foundation", included: true },
      { id: "auth-dashboard", included: true },
      { id: "billing-flow", included: true },
      { id: "admin-operations", included: true },
      { id: "r2-uploads", included: true },
      { id: "localization-setup", included: true },
      { id: "implementation-guidance", included: true },
    ],
    pricing: {
      creem: {
        oneTime: "prod_6uhcfBUcRxprqDvep0U5Jw",
        monthly: "prod_6uhcfBUcRxprqDvep0U5Jw",
        yearly: "prod_6uhcfBUcRxprqDvep0U5Jw",
      },
    },
    prices: {
      oneTime: 59.99,
      monthly: 49.99,
      yearly: 499.99,
    },
    currency: "USD",
  },
];

export const getProductTierById = (id: string): PricingTier | undefined => {
  return PRODUCT_TIERS.find((tier) => tier.id === id);
};

export const getProductTierByProductId = (
  productId: string,
): PricingTier | undefined => {
  for (const tier of PRODUCT_TIERS) {
    if (Object.values(tier.pricing.creem).includes(productId)) {
      return tier;
    }
  }

  return undefined;
};
