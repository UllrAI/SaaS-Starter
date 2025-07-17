/**
 * 定义产品特性
 */
export interface ProductFeature {
  name: string;
  included: boolean;
  description?: string;
}

/**
 * 定义一个定价套餐
 */
export interface PricingTier {
  id: string; // 我们系统内部的套餐 ID，如 'free', 'pro', 'enterprise'
  name: string;
  description: string;
  isPopular: boolean;
  features: ProductFeature[];
  pricing: {
    // 针对不同支付提供商的产品ID
    creem: {
      oneTime: string;
      monthly: string;
      yearly: string;
    };
    // stripe: { ... }; // 为未来扩展预留
  };
  prices: {
    oneTime: number;
    monthly: number;
    yearly: number;
  };
  currency: "USD" | "EUR"; // 支持的货币
}

/**
 * 统一定义所有产品套餐
 * 每个计费模式 (one_time, monthly, yearly) 都需要一个唯一的产品ID。
 */
export const PRODUCT_TIERS: PricingTier[] = [
  {
    id: "plus",
    name: "Plus",
    description: "Best for growing teams and businesses",
    isPopular: false,
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "10GB storage", included: false },
      { name: "Team collaboration", included: false },
      { name: "API access", included: false },
      { name: "Dedicated support", included: false },
      { name: "Advanced security", included: false },
    ],
    pricing: {
      creem: {
        // 示例ID, 请替换
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
    description: "Best for growing teams and businesses",
    isPopular: true,
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "10GB storage", included: true },
      { name: "Team collaboration", included: true },
      { name: "API access", included: true },
      { name: "Dedicated support", included: false },
      { name: "Advanced security", included: false },
    ],
    pricing: {
      creem: {
        // 示例ID, 请替换
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
    description: "Best for growing teams and businesses",
    isPopular: false,
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "10GB storage", included: true },
      { name: "Team collaboration", included: true },
      { name: "API access", included: true },
      { name: "Dedicated support", included: true },
      { name: "Advanced security", included: true },
    ],
    pricing: {
      creem: {
        // 示例ID, 请替换
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
  // 可以添加更多套餐...
];

/**
 * 根据内部套餐 ID 获取套餐详情
 * @param id - 套餐 ID ('pro', 'enterprise'等)
 * @returns PricingTier | undefined
 */
export const getProductTierById = (id: string): PricingTier | undefined => {
  return PRODUCT_TIERS.find((tier) => tier.id === id);
};

/**
 * 根据支付提供商的产品ID反查套餐详情
 * @param productId - 支付提供商的产品 ID
 * @returns PricingTier | undefined
 */
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
