export interface PricingTier {
  id: string;
  name: string;
  isPopular: boolean;
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
    pricing: {
      creem: {
        oneTime: "prod_1xvCrHVxDLPdoptwdH8Ake",
        monthly: "prod_1szT3Q4qCWKYeIVk56FD0v",
        yearly: "prod_2DyqDup95VCqxUv7rB6zWD",
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
    pricing: {
      creem: {
        oneTime: "prod_707V6jfaKsrUb9HckzuWpA",
        monthly: "prod_6E1zx5skxroRjjbPGcHMGs",
        yearly: "prod_3vq08mIOjo04eWmDlM5LKB",
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
    pricing: {
      creem: {
        oneTime: "prod_2msXlwJ3tbbUUp7hVIKJWk",
        monthly: "prod_2ZXku6CgdRY38k7VQff0me",
        yearly: "prod_2l5IMno8y3iv7KPg5QBuWM",
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
