import {
  PRODUCT_TIERS,
  getProductTierById,
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

  it("finds catalog tiers by id", () => {
    expect(getProductTierById("plus")?.name).toBe("Plus");
    expect(getProductTierById("pro")?.name).toBe("Professional");
    expect(getProductTierById("team")?.name).toBe("Team");
    expect(getProductTierById("unknown")).toBeUndefined();
  });

  it("exports a provider-neutral tier type", () => {
    const tier: PricingTier = {
      id: "test",
      name: "Test",
      isPopular: false,
      prices: { oneTime: 10, monthly: 5, yearly: 50 },
      currency: "USD",
    };

    expect(tier.prices.monthly).toBe(5);
  });
});
