import {
  PRODUCT_TIERS,
  getProductTierById,
  getProductTierByProductId,
  type PricingTier,
} from "./products";

describe("product configuration", () => {
  it("defines unique, valid catalog tiers", () => {
    expect(PRODUCT_TIERS.length).toBeGreaterThan(0);
    expect(new Set(PRODUCT_TIERS.map(({ id }) => id)).size).toBe(
      PRODUCT_TIERS.length,
    );

    for (const tier of PRODUCT_TIERS) {
      expect(tier.id).not.toBe("");
      expect(tier.name).not.toBe("");
      expect(["USD", "EUR"]).toContain(tier.currency);
      expect(tier.prices.oneTime).toBeGreaterThan(0);
      expect(tier.prices.monthly).toBeGreaterThan(0);
      expect(tier.prices.yearly / 12).toBeLessThanOrEqual(tier.prices.monthly);
    }
  });

  it("keeps test and live Creem product namespaces separate", () => {
    for (const tier of PRODUCT_TIERS) {
      expect(tier.pricing.creem.test_mode).toEqual({
        oneTime: "",
        monthly: "",
        yearly: "",
      });
      for (const productId of Object.values(tier.pricing.creem.live_mode)) {
        expect(productId).toMatch(/^prod_[A-Za-z0-9]+$/);
      }
    }
  });

  it("finds catalog tiers by id", () => {
    expect(getProductTierById("plus")?.name).toBe("Plus");
    expect(getProductTierById("pro")?.name).toBe("Professional");
    expect(getProductTierById("team")?.name).toBe("Team");
    expect(getProductTierById("unknown")).toBeUndefined();
  });

  it("limits environment-specific product lookups to that environment", () => {
    const productId = PRODUCT_TIERS[0]!.pricing.creem.live_mode.monthly;

    expect(getProductTierByProductId(productId, "live_mode")?.id).toBe("plus");
    expect(getProductTierByProductId(productId, "test_mode")).toBeUndefined();
    expect(getProductTierByProductId(productId)?.id).toBe("plus");
  });

  it("ignores empty and unknown product ids", () => {
    expect(getProductTierByProductId("")).toBeUndefined();
    expect(getProductTierByProductId("prod_unknown")).toBeUndefined();
  });

  it("exports an explicit environment-aware tier type", () => {
    const tier: PricingTier = {
      id: "test",
      name: "Test",
      isPopular: false,
      pricing: {
        creem: {
          test_mode: {
            oneTime: "prod_test_once",
            monthly: "prod_test_monthly",
            yearly: "prod_test_yearly",
          },
          live_mode: {
            oneTime: "prod_live_once",
            monthly: "prod_live_monthly",
            yearly: "prod_live_yearly",
          },
        },
      },
      prices: { oneTime: 10, monthly: 5, yearly: 50 },
      currency: "USD",
    };

    expect(tier.pricing.creem.live_mode.monthly).toBe("prod_live_monthly");
  });
});
