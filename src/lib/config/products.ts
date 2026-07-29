export interface PricingTier {
  id: string;
  name: string;
  isPopular: boolean;
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
